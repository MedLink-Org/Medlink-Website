import { asCollection, request } from "./apiClient";
import { normalizeAppointmentStatus } from "../utils/appointmentStatus";

const RESOURCE_PATH = "/api/appointments";

function normalizeDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : value || "";
}

function toApiAppointment(appointment) {
  return {
    appointment_id: appointment.appointmentId ?? appointment.appointment_id ?? appointment.id,
    patient_id: appointment.patientId ?? appointment.patient_id,
    doctor_id: appointment.doctorId ?? appointment.doctor_id,
    nurse_id: appointment.nurseId ?? appointment.nurse_id,
    appointment_date: appointment.date ?? appointment.appointment_date,
    appointment_time: appointment.time ?? appointment.appointment_time,
    visit_type: appointment.visitType ?? appointment.visit_type,
    reason: appointment.reason,
    status: normalizeAppointmentStatus(appointment.status)
  };
}

function normalizeAppointment(appointment = {}) {
  return {
    ...appointment,
    appointmentId: appointment.appointmentId ?? appointment.appointment_id ?? appointment.id ?? "",
    patientId: appointment.patientId ?? appointment.patient_id ?? "",
    doctorId: appointment.doctorId ?? appointment.doctor_id ?? "",
    nurseId: appointment.nurseId ?? appointment.nurse_id ?? "",
    date: normalizeDate(appointment.date ?? appointment.appointment_date),
    time: appointment.time ?? appointment.appointment_time ?? "",
    visitType: appointment.visitType ?? appointment.visit_type ?? "",
    reason: appointment.reason ?? "",
    status: normalizeAppointmentStatus(appointment.status)
  };
}

function normalizeCollection(response) {
  return asCollection(response).map(normalizeAppointment);
}

export async function getAll(options = {}) {
  return normalizeCollection(await request(RESOURCE_PATH, options));
}

export async function getById(id, options = {}) {
  return normalizeAppointment(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function getByPatientId(patientId, options = {}) {
  return normalizeCollection(
    await request(`${RESOURCE_PATH}/patient/${encodeURIComponent(patientId)}`, options)
  );
}

export async function getByDoctorId(doctorId, options = {}) {
  return normalizeCollection(
    await request(`${RESOURCE_PATH}/doctor/${encodeURIComponent(doctorId)}`, options)
  );
}

export async function getByNurseId(nurseId, options = {}) {
  return normalizeCollection(
    await request(`${RESOURCE_PATH}/nurse/${encodeURIComponent(nurseId)}`, options)
  );
}

export async function create(appointment, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiAppointment(appointment)
  });
  return normalizeAppointment({ ...appointment, ...(response || {}) });
}

export async function update(id, appointment, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiAppointment(appointment)
  });
  return normalizeAppointment({ ...appointment, ...(response || {}) });
}

async function deleteAppointment(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteAppointment as delete };
