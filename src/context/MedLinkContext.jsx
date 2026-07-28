import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createSeedData, doctors as defaultDoctors } from "../data/seedData";
import { today } from "../utils/date";

const STORAGE_KEY = "medlink_react_v1";
const LEGACY_KEY = "medlink_v3";
const MedLinkContext = createContext(null);

function normalizeState(state) {
  const patients = Array.isArray(state?.patients) ? state.patients : [];
  const appointments = Array.isArray(state?.appointments) ? state.appointments : [];
  const bills = Array.isArray(state?.bills) ? state.bills : [];

  return {
    patients: patients.map(patient => ({
      phone: patient.phone || patient.contact || "",
      email: patient.email || "",
      medicalHistory: patient.medicalHistory || "",
      ...patient
    })),
    doctors: Array.isArray(state?.doctors) && state.doctors.length ? state.doctors : defaultDoctors,
    appointments: appointments.map(appointment => ({
      visitType: appointment.visitType || "Consultation",
      reason: appointment.reason || "General consultation",
      status: appointment.status || "Scheduled",
      ...appointment
    })),
    bills,
    nextPatientId: state?.nextPatientId || patients.length + 1,
    nextAppointmentId: state?.nextAppointmentId || state?.nextApptId || appointments.length + 1,
    nextBillId: state?.nextBillId || bills.length + 1
  };
}

function loadInitialState() {
  for (const key of [STORAGE_KEY, LEGACY_KEY]) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (key === STORAGE_KEY || parsed.patients?.length || parsed.appointments?.length) {
        return normalizeState(parsed);
      }
    } catch {
      // Fall through to the next persisted source or the demo seed.
    }
  }
  return createSeedData();
}

export function MedLinkProvider({ children }) {
  const [state, setState] = useState(loadInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const actions = useMemo(() => ({
    addPatient(patient) {
      const patientId = `P${String(state.nextPatientId).padStart(3, "0")}`;
      const record = { patientId, ...patient };
      setState(current => ({
        ...current,
        patients: [...current.patients, record],
        nextPatientId: current.nextPatientId + 1
      }));
      return record;
    },

    addAppointment(appointment) {
      const appointmentId = `A${String(state.nextAppointmentId).padStart(3, "0")}`;
      const record = { appointmentId, status: "Scheduled", ...appointment };
      setState(current => ({
        ...current,
        appointments: [...current.appointments, record],
        nextAppointmentId: current.nextAppointmentId + 1
      }));
      return record;
    },

    setAppointmentStatus(appointmentId, status) {
      setState(current => ({
        ...current,
        appointments: current.appointments.map(appointment =>
          appointment.appointmentId === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      }));
    },

    addBill(bill) {
      const billId = `B${String(state.nextBillId).padStart(3, "0")}`;
      const record = {
        billId,
        status: "Pending",
        dateIssued: today(),
        datePaid: "",
        ...bill,
        amount: Number(bill.amount)
      };
      setState(current => ({
        ...current,
        bills: [...current.bills, record],
        nextBillId: current.nextBillId + 1
      }));
      return record;
    },

    markBillPaid(billId) {
      setState(current => ({
        ...current,
        bills: current.bills.map(bill =>
          bill.billId === billId
            ? { ...bill, status: "Paid", datePaid: today() }
            : bill
        )
      }));
    }
  }), [state.nextAppointmentId, state.nextBillId, state.nextPatientId]);

  const selectors = useMemo(() => ({
    patientById(patientId) {
      return state.patients.find(patient => patient.patientId === patientId);
    },
    doctorById(doctorId) {
      return state.doctors.find(doctor => doctor.doctorId === doctorId);
    }
  }), [state.doctors, state.patients]);

  const value = useMemo(
    () => ({ ...state, ...actions, ...selectors }),
    [actions, selectors, state]
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
