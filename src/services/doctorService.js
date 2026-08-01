import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/doctors";

function toApiDoctor(doctor) {
  return {
    first_name: doctor.firstName ?? doctor.first_name,
    last_name: doctor.lastName ?? doctor.last_name,
    date_of_birth: doctor.dob ?? doctor.dateOfBirth ?? doctor.date_of_birth,
    contact_info: doctor.phone ?? doctor.contactInfo ?? doctor.contact_info,
    address: doctor.address,
    specialization: doctor.specialization,
    date_of_employment: doctor.dateOfEmployment ?? doctor.date_of_employment
  };
}

function unwrapDoctor(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload || {};
  }
  return payload.doctor ?? payload.record ?? payload.item ?? payload;
}

function normalizeDate(value) {
  if (!value || typeof value !== "string") return value || "";
  if (!value.includes("T")) return value.slice(0, 10);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const dateParts = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function normalizeDoctor(doctor = {}) {
  return {
    ...doctor,
    doctorId: doctor.doctorId
      ?? doctor.doctor_id
      ?? doctor.doctorID
      ?? doctor.Doctor_ID
      ?? doctor.id
      ?? doctor.insertId
      ?? "",
    firstName: doctor.firstName ?? doctor.first_name ?? "",
    lastName: doctor.lastName ?? doctor.last_name ?? "",
    dob: normalizeDate(doctor.dob ?? doctor.dateOfBirth ?? doctor.date_of_birth),
    phone: doctor.phone ?? doctor.contactInfo ?? doctor.contact_info ?? "",
    address: doctor.address ?? "",
    specialization: doctor.specialization ?? "",
    dateOfEmployment: normalizeDate(doctor.dateOfEmployment ?? doctor.date_of_employment)
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(doctor => normalizeDoctor(unwrapDoctor(doctor)));
}

export async function getById(id, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options);
  return normalizeDoctor(unwrapDoctor(response));
}

export async function create(doctor, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiDoctor(doctor)
  });
  return normalizeDoctor({ ...doctor, ...unwrapDoctor(response) });
}

export async function update(id, doctor, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiDoctor(doctor)
  });
  return normalizeDoctor({ ...doctor, ...unwrapDoctor(response) });
}

async function deleteDoctor(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteDoctor as delete };
