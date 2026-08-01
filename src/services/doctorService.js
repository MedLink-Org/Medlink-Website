import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/doctors";

function toApiDoctor(doctor) {
  return {
    doctor_id: doctor.doctorId ?? doctor.doctor_id ?? doctor.id,
    first_name: doctor.firstName ?? doctor.first_name,
    last_name: doctor.lastName ?? doctor.last_name,
    specialization: doctor.specialization,
    room: doctor.room,
    phone: doctor.phone,
    email: doctor.email
  };
}

function normalizeDoctor(doctor = {}) {
  return {
    ...doctor,
    doctorId: doctor.doctorId ?? doctor.doctor_id ?? doctor.id ?? "",
    firstName: doctor.firstName ?? doctor.first_name ?? "",
    lastName: doctor.lastName ?? doctor.last_name ?? "",
    specialization: doctor.specialization ?? "",
    room: doctor.room ?? "",
    phone: doctor.phone ?? "",
    email: doctor.email ?? ""
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(normalizeDoctor);
}

export async function getById(id, options = {}) {
  return normalizeDoctor(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function create(doctor, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiDoctor(doctor)
  });
  return normalizeDoctor({ ...doctor, ...(response || {}) });
}

export async function update(id, doctor, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiDoctor(doctor)
  });
  return normalizeDoctor({ ...doctor, ...(response || {}) });
}

async function deleteDoctor(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteDoctor as delete };
