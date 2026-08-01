import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/patients";

function normalizeDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : value || "";
}

function normalizeGender(value) {
  if (typeof value !== "string" || !value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function toApiPatient(patient) {
  return {
    patient_id: patient.patientId ?? patient.patient_id ?? patient.id,
    first_name: patient.firstName ?? patient.first_name,
    last_name: patient.lastName ?? patient.last_name,
    date_of_birth: patient.dob ?? patient.dateOfBirth ?? patient.date_of_birth,
    contact_info: patient.phone ?? patient.contactInfo ?? patient.contact_info,
    gender: patient.gender,
    address: patient.address,
    email: patient.email,
    blood_type: patient.bloodType ?? patient.blood_type,
    genotype: patient.genotype,
    medical_history: patient.medicalHistory ?? patient.medical_history
  };
}

function normalizePatient(patient = {}) {
  return {
    ...patient,
    patientId: patient.patientId ?? patient.patient_id ?? patient.id ?? "",
    firstName: patient.firstName ?? patient.first_name ?? "",
    lastName: patient.lastName ?? patient.last_name ?? "",
    dob: normalizeDate(patient.dob ?? patient.dateOfBirth ?? patient.date_of_birth),
    phone: patient.phone ?? patient.contactInfo ?? patient.contact_info ?? "",
    email: patient.email ?? "",
    gender: normalizeGender(patient.gender),
    address: patient.address ?? "",
    bloodType: patient.bloodType ?? patient.blood_type ?? "",
    genotype: patient.genotype ?? "",
    medicalHistory: patient.medicalHistory ?? patient.medical_history ?? ""
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(normalizePatient);
}

export async function getById(id, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options);
  return normalizePatient(response);
}

export async function create(patient, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiPatient(patient)
  });
  return normalizePatient({ ...patient, ...(response || {}) });
}

export async function update(id, patient, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiPatient(patient)
  });
  return normalizePatient({ ...patient, ...(response || {}) });
}

async function deletePatient(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deletePatient as delete };
