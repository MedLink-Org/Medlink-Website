import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import * as appointmentService from "../services/appointmentService";
import * as billingService from "../services/billingService";
import * as doctorService from "../services/doctorService";
import * as medicalRecordService from "../services/medicalRecordService";
import * as nurseService from "../services/nurseService";
import * as patientService from "../services/patientService";
import * as staffService from "../services/staffService";
import { hasPermission, PERMISSIONS, ROLES } from "../auth/accessControl";
import { useAuth } from "./AuthContext";
import { createSeedData } from "../data/seedData.js";
import { today } from "../utils/date";

const STORAGE_KEY_PREFIX = "medlink_offline_v1";
const RESOURCE_KEYS = [
  "patients",
  "doctors",
  "nurses",
  "staff",
  "appointments",
  "medicalRecords",
  "bills"
];
const MedLinkContext = createContext(null);

function createEmptyState() {
  return {
    patients: [],
    doctors: [],
    nurses: [],
    staff: [],
    appointments: [],
    medicalRecords: [],
    bills: []
  };
}

function createFallbackState() {
  const seed = createSeedData();
  return {
    patients: seed.patients,
    doctors: seed.doctors,
    nurses: seed.nurses,
    staff: [],
    appointments: seed.appointments,
    medicalRecords: [],
    bills: seed.bills
  };
}

function offlineStorageKey(user) {
  const accountId = user?.id || user?.email;
  return accountId ? `${STORAGE_KEY_PREFIX}:${encodeURIComponent(accountId)}` : "";
}

function loadFallbackState(user) {
  if (user?.role !== ROLES.STAFF) return createEmptyState();

  const fallback = createFallbackState();
  if (typeof window === "undefined") return fallback;

  try {
    const storageKey = offlineStorageKey(user);
    const stored = storageKey
      ? JSON.parse(window.localStorage.getItem(storageKey))
      : null;
    if (!stored || typeof stored !== "object") return fallback;

    return Object.fromEntries(
      RESOURCE_KEYS.map(key => [
        key,
        Array.isArray(stored[key]) ? stored[key] : fallback[key]
      ])
    );
  } catch {
    return fallback;
  }
}

function createResourceStatus(value) {
  return Object.fromEntries(RESOURCE_KEYS.map(key => [key, value]));
}

function isConnectionError(error) {
  const message = error?.message || "";
  return error instanceof TypeError
    || /failed to fetch|network error|networkerror|load failed|status 50[234]/i.test(message);
}

function nextIdentifier(records, field, prefix, width = 3) {
  const highest = records.reduce((maximum, record) => {
    const match = String(record[field] || "").match(new RegExp(`^${prefix}(\\d+)$`, "i"));
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(width, "0")}`;
}

export function MedLinkProvider({ children }) {
  const { user } = useAuth();
  const offlineEnabled = user?.role === ROLES.STAFF;
  const [state, setState] = useState(createEmptyState);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [remoteResources, setRemoteResources] = useState(() => createResourceStatus(false));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const options = { signal: controller.signal };

    async function loadData() {
      setLoading(true);
      setLoadError("");

      const fallback = loadFallbackState(user);
      const resources = [
        { key: "patients", label: "patients", permission: PERMISSIONS.PATIENTS_VIEW, load: patientService.getAll },
        { key: "doctors", label: "doctors", permission: PERMISSIONS.DOCTORS_VIEW, load: doctorService.getAll },
        { key: "nurses", label: "nurses", permission: PERMISSIONS.NURSES_VIEW, load: nurseService.getAll },
        { key: "staff", label: "staff", permission: PERMISSIONS.STAFF_VIEW, load: staffService.getAll },
        { key: "appointments", label: "appointments", permission: PERMISSIONS.APPOINTMENTS_VIEW, load: appointmentService.getAll },
        { key: "medicalRecords", label: "medical records", permission: PERMISSIONS.MEDICAL_RECORDS_VIEW, load: medicalRecordService.getAll },
        { key: "bills", label: "billing", permission: PERMISSIONS.BILLING_VIEW, load: billingService.getAll }
      ].filter(resource => hasPermission(user?.role, resource.permission));
      const results = await Promise.allSettled(
        resources.map(resource => resource.load(options))
      );

      if (!active) return;

      const nextState = createEmptyState();
      const nextRemoteResources = createResourceStatus(false);
      const failedResources = [];

      results.forEach((result, index) => {
        const resource = resources[index];
        if (result.status === "fulfilled") {
          nextState[resource.key] = result.value;
          nextRemoteResources[resource.key] = true;
        } else {
          nextState[resource.key] = offlineEnabled ? fallback[resource.key] : [];
          failedResources.push(resource.label);
        }
      });

      setState(nextState);
      setRemoteResources(nextRemoteResources);
      if (resources.length && failedResources.length === resources.length) {
        setLoadError(offlineEnabled
          ? "The MedLink API is unavailable. Showing local clinic records; changes will be stored on this device."
          : "The MedLink API is unavailable. Clinic records cannot be shown for this account until the connection is restored.");
      } else if (failedResources.length) {
        setLoadError(offlineEnabled
          ? `Some API resources are unavailable (${failedResources.join(", ")}). Local records are shown for those sections.`
          : `Some API resources are unavailable (${failedResources.join(", ")}). Those records cannot be shown until the connection is restored.`);
      }
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [offlineEnabled, reloadVersion, user]);

  useEffect(() => {
    if (!offlineEnabled) return;

    const usingFallback = Object.values(remoteResources).some(available => !available);
    if (loading || !usingFallback || typeof window === "undefined") return;

    try {
      const storageKey = offlineStorageKey(user);
      if (storageKey) {
        window.localStorage.setItem(storageKey, JSON.stringify(state));
      }
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [loading, offlineEnabled, remoteResources, state, user]);

  const reload = useCallback(() => {
    setReloadVersion(current => current + 1);
  }, []);

  const runMutation = useCallback(async (resource, remoteOperation, localOperation) => {
    if (!remoteResources[resource]) {
      if (offlineEnabled) return localOperation();
      throw new Error("The MedLink API is unavailable. Reconnect before changing clinic records.");
    }

    try {
      return await remoteOperation();
    } catch (error) {
      if (!isConnectionError(error)) throw error;
      if (!offlineEnabled) throw error;

      setRemoteResources(current => ({ ...current, [resource]: false }));
      setLoadError(
        "The MedLink API connection was lost. Changes are being stored locally on this device."
      );
      return localOperation();
    }
  }, [offlineEnabled, remoteResources]);

  const addPatient = useCallback(async patient => {
    const patientId = nextIdentifier(state.patients, "patientId", "P");
    const localRecord = { patientId, ...patient };
    const record = await runMutation(
      "patients",
      () => patientService.create(localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      patients: [...current.patients, record]
    }));
    return record;
  }, [runMutation, state.patients]);

  const addDoctor = useCallback(async doctor => {
    const doctorId = nextIdentifier(state.doctors, "doctorId", "D", 2);
    const localRecord = { doctorId, ...doctor };
    const record = await runMutation(
      "doctors",
      () => doctorService.create(doctor),
      () => localRecord
    );
    setState(current => ({
      ...current,
      doctors: [...current.doctors, record]
    }));
    return record;
  }, [runMutation, state.doctors]);

  const addNurse = useCallback(async nurse => {
    const nurseId = nextIdentifier(state.nurses, "nurseId", "N", 2);
    const localRecord = { nurseId, ...nurse };
    const record = await runMutation(
      "nurses",
      () => nurseService.create(localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      nurses: [...current.nurses, record]
    }));
    return record;
  }, [runMutation, state.nurses]);

  const addAppointment = useCallback(async appointment => {
    const appointmentId = nextIdentifier(state.appointments, "appointmentId", "A");
    const localRecord = {
      appointmentId,
      status: "Scheduled",
      ...appointment
    };
    const record = await runMutation(
      "appointments",
      () => appointmentService.create(localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      appointments: [...current.appointments, record]
    }));
    return record;
  }, [runMutation, state.appointments]);

  const setAppointmentStatus = useCallback(async (appointmentId, status) => {
    const appointment = state.appointments.find(item => item.appointmentId === appointmentId);
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} was not found.`);
    }

    const localRecord = {
      ...appointment,
      status
    };
    const record = await runMutation(
      "appointments",
      () => appointmentService.update(appointmentId, localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      appointments: current.appointments.map(item =>
        item.appointmentId === appointmentId ? record : item
      )
    }));
    return record;
  }, [runMutation, state.appointments]);

  const addBill = useCallback(async bill => {
    const billId = nextIdentifier(state.bills, "billId", "B");
    const localRecord = {
      billId,
      status: "Pending",
      dateIssued: today(),
      datePaid: "",
      ...bill,
      amount: Number(bill.amount)
    };
    const record = await runMutation(
      "bills",
      () => billingService.create(localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      bills: [...current.bills, record]
    }));
    return record;
  }, [runMutation, state.bills]);

  const markBillPaid = useCallback(async billId => {
    const bill = state.bills.find(item => item.billId === billId);
    if (!bill) {
      throw new Error(`Bill ${billId} was not found.`);
    }

    const localRecord = {
      ...bill,
      status: "Paid",
      datePaid: today()
    };
    const record = await runMutation(
      "bills",
      () => billingService.update(billId, localRecord),
      () => localRecord
    );
    setState(current => ({
      ...current,
      bills: current.bills.map(item => item.billId === billId ? record : item)
    }));
    return record;
  }, [runMutation, state.bills]);

  const actions = useMemo(() => ({
    addPatient,
    addDoctor,
    addNurse,
    addAppointment,
    setAppointmentStatus,
    addBill,
    markBillPaid,
    reload
  }), [
    addAppointment,
    addBill,
    addDoctor,
    addNurse,
    addPatient,
    markBillPaid,
    reload,
    setAppointmentStatus
  ]);

  const selectors = useMemo(() => ({
    patientById(patientId) {
      return state.patients.find(patient => String(patient.patientId) === String(patientId));
    },
    doctorById(doctorId) {
      return state.doctors.find(doctor => String(doctor.doctorId) === String(doctorId));
    }
  }), [state.doctors, state.patients]);

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
      ...selectors,
      loading,
      offlineEnabled,
      error: loadError
    }),
    [actions, loadError, loading, offlineEnabled, selectors, state]
  );

  return <MedLinkContext.Provider value={value}>{children}</MedLinkContext.Provider>;
}

export function useMedLink() {
  const context = useContext(MedLinkContext);
  if (!context) {
    throw new Error("useMedLink must be used within MedLinkProvider.");
  }
  return context;
}
