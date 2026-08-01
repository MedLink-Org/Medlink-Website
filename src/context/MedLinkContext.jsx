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
import { today } from "../utils/date";

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

function nextIdentifier(records, field, prefix) {
  const highest = records.reduce((maximum, record) => {
    const match = String(record[field] || "").match(new RegExp(`^${prefix}(\\d+)$`, "i"));
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

export function MedLinkProvider({ children }) {
  const [state, setState] = useState(createEmptyState);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const options = { signal: controller.signal };

    async function loadData() {
      setLoading(true);
      setLoadError("");

      try {
        const [
          patients,
          doctors,
          nurses,
          staff,
          appointments,
          medicalRecords,
          bills
        ] = await Promise.all([
          patientService.getAll(options),
          doctorService.getAll(options),
          nurseService.getAll(options),
          staffService.getAll(options),
          appointmentService.getAll(options),
          medicalRecordService.getAll(options),
          billingService.getAll(options)
        ]);

        if (!active) return;
        setState({
          patients,
          doctors,
          nurses,
          staff,
          appointments,
          medicalRecords,
          bills
        });
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setLoadError(error.message || "Unable to load clinic data.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadVersion]);

  const reload = useCallback(() => {
    setReloadVersion(current => current + 1);
  }, []);

  const addPatient = useCallback(async patient => {
    const patientId = nextIdentifier(state.patients, "patientId", "P");
    const record = await patientService.create({ patientId, ...patient });
    setState(current => ({
      ...current,
      patients: [...current.patients, record]
    }));
    return record;
  }, [state.patients]);

  const addAppointment = useCallback(async appointment => {
    const appointmentId = nextIdentifier(state.appointments, "appointmentId", "A");
    const record = await appointmentService.create({
      appointmentId,
      status: "Scheduled",
      ...appointment
    });
    setState(current => ({
      ...current,
      appointments: [...current.appointments, record]
    }));
    return record;
  }, [state.appointments]);

  const setAppointmentStatus = useCallback(async (appointmentId, status) => {
    const appointment = state.appointments.find(item => item.appointmentId === appointmentId);
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} was not found.`);
    }

    const record = await appointmentService.update(appointmentId, {
      ...appointment,
      status
    });
    setState(current => ({
      ...current,
      appointments: current.appointments.map(item =>
        item.appointmentId === appointmentId ? record : item
      )
    }));
    return record;
  }, [state.appointments]);

  const addBill = useCallback(async bill => {
    const billId = nextIdentifier(state.bills, "billId", "B");
    const record = await billingService.create({
      billId,
      status: "Pending",
      dateIssued: today(),
      datePaid: "",
      ...bill,
      amount: Number(bill.amount)
    });
    setState(current => ({
      ...current,
      bills: [...current.bills, record]
    }));
    return record;
  }, [state.bills]);

  const markBillPaid = useCallback(async billId => {
    const bill = state.bills.find(item => item.billId === billId);
    if (!bill) {
      throw new Error(`Bill ${billId} was not found.`);
    }

    const record = await billingService.update(billId, {
      ...bill,
      status: "Paid",
      datePaid: today()
    });
    setState(current => ({
      ...current,
      bills: current.bills.map(item => item.billId === billId ? record : item)
    }));
    return record;
  }, [state.bills]);

  const actions = useMemo(() => ({
    addPatient,
    addAppointment,
    setAppointmentStatus,
    addBill,
    markBillPaid,
    reload
  }), [
    addAppointment,
    addBill,
    addPatient,
    markBillPaid,
    reload,
    setAppointmentStatus
  ]);

  const selectors = useMemo(() => ({
    patientById(patientId) {
      return state.patients.find(patient => patient.patientId === patientId);
    },
    doctorById(doctorId) {
      return state.doctors.find(doctor => doctor.doctorId === doctorId);
    }
  }), [state.doctors, state.patients]);

  const value = useMemo(
    () => ({
      ...state,
      ...actions,
      ...selectors,
      loading,
      error: loadError
    }),
    [actions, loadError, loading, selectors, state]
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
