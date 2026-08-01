import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/nurses";

function toApiNurse(nurse) {
  return {
    nurse_id: nurse.nurseId ?? nurse.nurse_id ?? nurse.id,
    first_name: nurse.firstName ?? nurse.first_name,
    last_name: nurse.lastName ?? nurse.last_name,
    specialization: nurse.specialization,
    department: nurse.department,
    phone: nurse.phone,
    email: nurse.email
  };
}

function normalizeNurse(nurse = {}) {
  return {
    ...nurse,
    nurseId: nurse.nurseId ?? nurse.nurse_id ?? nurse.id ?? "",
    firstName: nurse.firstName ?? nurse.first_name ?? "",
    lastName: nurse.lastName ?? nurse.last_name ?? "",
    specialization: nurse.specialization ?? "",
    department: nurse.department ?? "",
    phone: nurse.phone ?? "",
    email: nurse.email ?? ""
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(normalizeNurse);
}

export async function getById(id, options = {}) {
  return normalizeNurse(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function create(nurse, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiNurse(nurse)
  });
  return normalizeNurse({ ...nurse, ...(response || {}) });
}

export async function update(id, nurse, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiNurse(nurse)
  });
  return normalizeNurse({ ...nurse, ...(response || {}) });
}

async function deleteNurse(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteNurse as delete };
