import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/staff";

function toApiStaffMember(staffMember) {
  return {
    staff_id: staffMember.staffId ?? staffMember.staff_id ?? staffMember.id,
    first_name: staffMember.firstName ?? staffMember.first_name,
    last_name: staffMember.lastName ?? staffMember.last_name,
    role: staffMember.role,
    department: staffMember.department,
    phone: staffMember.phone,
    email: staffMember.email
  };
}

function normalizeStaffMember(staffMember = {}) {
  return {
    ...staffMember,
    staffId: staffMember.staffId ?? staffMember.staff_id ?? staffMember.id ?? "",
    firstName: staffMember.firstName ?? staffMember.first_name ?? "",
    lastName: staffMember.lastName ?? staffMember.last_name ?? "",
    role: staffMember.role ?? "",
    department: staffMember.department ?? "",
    phone: staffMember.phone ?? "",
    email: staffMember.email ?? ""
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(normalizeStaffMember);
}

export async function getById(id, options = {}) {
  return normalizeStaffMember(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function create(staffMember, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiStaffMember(staffMember)
  });
  return normalizeStaffMember({ ...staffMember, ...(response || {}) });
}

export async function update(id, staffMember, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiStaffMember(staffMember)
  });
  return normalizeStaffMember({ ...staffMember, ...(response || {}) });
}

async function deleteStaffMember(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteStaffMember as delete };
