import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/medical-records";

function normalizeDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : value || "";
}

function toApiMedicalRecord(record) {
  return {
    medical_record_id: record.medicalRecordId ?? record.medical_record_id ?? record.recordId ?? record.id,
    patient_id: record.patientId ?? record.patient_id,
    date: record.date ?? record.recordDate ?? record.record_date,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    notes: record.notes,
    description: record.description
  };
}

function normalizeMedicalRecord(record = {}) {
  return {
    ...record,
    medicalRecordId: record.medicalRecordId ?? record.medical_record_id ?? record.recordId ?? record.id ?? "",
    patientId: record.patientId ?? record.patient_id ?? "",
    date: normalizeDate(record.date ?? record.recordDate ?? record.record_date),
    diagnosis: record.diagnosis ?? "",
    treatment: record.treatment ?? "",
    notes: record.notes ?? "",
    description: record.description ?? ""
  };
}

function normalizeCollection(response) {
  return asCollection(response).map(normalizeMedicalRecord);
}

export async function getAll(options = {}) {
  return normalizeCollection(await request(RESOURCE_PATH, options));
}

export async function getById(id, options = {}) {
  return normalizeMedicalRecord(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function getByPatientId(patientId, options = {}) {
  return normalizeCollection(
    await request(`${RESOURCE_PATH}/patient/${encodeURIComponent(patientId)}`, options)
  );
}

export async function create(record, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiMedicalRecord(record)
  });
  return normalizeMedicalRecord({ ...record, ...(response || {}) });
}

export async function update(id, record, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiMedicalRecord(record)
  });
  return normalizeMedicalRecord({ ...record, ...(response || {}) });
}

async function deleteMedicalRecord(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteMedicalRecord as delete };
