import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/staff";

function toApiStaffMember(staffMember) {
  return {
    staff_id: staffMember.staffId ?? staffMember.staff_id ?? staffMember.id,
    first_name: staffMember.firstName ?? staffMember.first_name,
    last_name: staffMember.lastName ?? staffMember.last_name,
    date_of_birth: staffMember.dob ?? staffMember.dateOfBirth ?? staffMember.date_of_birth,
    contact_info: staffMember.phone ?? staffMember.contactInfo ?? staffMember.contact_info,
    address: staffMember.address,
    date_of_employment: staffMember.dateOfEmployment ?? staffMember.date_of_employment
  };
}

function normalizeStaffMember(staffMember = {}) {
  return {
    ...staffMember,
    staffId: staffMember.staffId ?? staffMember.staff_id ?? staffMember.id ?? "",
    firstName: staffMember.firstName ?? staffMember.first_name ?? "",
    lastName: staffMember.lastName ?? staffMember.last_name ?? "",
    dob: staffMember.dob ?? staffMember.dateOfBirth ?? staffMember.date_of_birth ?? "",
    phone: staffMember.phone ?? staffMember.contactInfo ?? staffMember.contact_info ?? "",
    address: staffMember.address ?? "",
    dateOfEmployment: staffMember.dateOfEmployment ?? staffMember.date_of_employment ?? ""
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
