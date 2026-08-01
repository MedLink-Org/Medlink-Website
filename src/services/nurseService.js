import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/nurses";

function normalizeDate(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

function toApiNurse(nurse) {
  return {
    nurse_id: nurse.nurseId ?? nurse.nurse_id ?? nurse.id,
    first_name: nurse.firstName ?? nurse.first_name,
    last_name: nurse.lastName ?? nurse.last_name,
    date_of_birth: nurse.dob ?? nurse.dateOfBirth ?? nurse.date_of_birth,
    contact_info: nurse.phone ?? nurse.contactInfo ?? nurse.contact_info,
    address: nurse.address,
    date_of_employment: nurse.dateOfEmployment ?? nurse.date_of_employment
  };
}

function unwrapNurse(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload || {};
  }
  return payload.nurse ?? payload.record ?? payload.item ?? payload;
}

function normalizeNurse(nurse = {}) {
  return {
    ...nurse,
    nurseId: nurse.nurseId
      ?? nurse.nurse_id
      ?? nurse.nurseID
      ?? nurse.Nurse_ID
      ?? nurse.id
      ?? nurse.insertId
      ?? "",
    firstName: nurse.firstName ?? nurse.first_name ?? "",
    lastName: nurse.lastName ?? nurse.last_name ?? "",
    dob: normalizeDate(nurse.dob ?? nurse.dateOfBirth ?? nurse.date_of_birth),
    phone: nurse.phone ?? nurse.contactInfo ?? nurse.contact_info ?? "",
    address: nurse.address ?? "",
    dateOfEmployment: normalizeDate(nurse.dateOfEmployment ?? nurse.date_of_employment)
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(nurse => normalizeNurse(unwrapNurse(nurse)));
}

export async function getById(id, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options);
  return normalizeNurse(unwrapNurse(response));
}

export async function create(nurse, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiNurse(nurse)
  });
  return normalizeNurse({ ...nurse, ...unwrapNurse(response) });
}

export async function update(id, nurse, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiNurse(nurse)
  });
  return normalizeNurse({ ...nurse, ...unwrapNurse(response) });
}

async function deleteNurse(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteNurse as delete };
