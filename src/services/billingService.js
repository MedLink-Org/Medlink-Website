import { asCollection, request } from "./apiClient";

const RESOURCE_PATH = "/api/billing";

function normalizeDate(value) {
  return typeof value === "string" ? value.slice(0, 10) : value || "";
}

function toApiBill(bill) {
  return {
    bill_id: bill.billId ?? bill.bill_id ?? bill.id,
    patient_id: bill.patientId ?? bill.patient_id,
    bill_type: bill.billType ?? bill.bill_type,
    amount: bill.amount === "" || bill.amount === undefined ? bill.amount : Number(bill.amount),
    mode: bill.mode,
    date_issued: bill.dateIssued ?? bill.date_issued,
    date_paid: bill.datePaid ?? bill.date_paid,
    status: bill.status
  };
}

function normalizeBill(bill = {}) {
  return {
    ...bill,
    billId: bill.billId ?? bill.bill_id ?? bill.id ?? "",
    patientId: bill.patientId ?? bill.patient_id ?? "",
    billType: bill.billType ?? bill.bill_type ?? "",
    amount: Number(bill.amount || 0),
    mode: bill.mode ?? "",
    dateIssued: normalizeDate(bill.dateIssued ?? bill.date_issued),
    datePaid: normalizeDate(bill.datePaid ?? bill.date_paid),
    status: bill.status ?? ""
  };
}

export async function getAll(options = {}) {
  const response = await request(RESOURCE_PATH, options);
  return asCollection(response).map(normalizeBill);
}

export async function getById(id, options = {}) {
  return normalizeBill(await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options));
}

export async function getByPatientId(patientId, options = {}) {
  const response = await request(`${RESOURCE_PATH}/patient/${encodeURIComponent(patientId)}`, options);
  return asCollection(response).map(normalizeBill);
}

export async function create(bill, options = {}) {
  const response = await request(RESOURCE_PATH, {
    ...options,
    method: "POST",
    body: toApiBill(bill)
  });
  return normalizeBill({ ...bill, ...(response || {}) });
}

export async function update(id, bill, options = {}) {
  const response = await request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "PUT",
    body: toApiBill(bill)
  });
  return normalizeBill({ ...bill, ...(response || {}) });
}

async function deleteBill(id, options = {}) {
  return request(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, {
    ...options,
    method: "DELETE"
  });
}

export { deleteBill as delete };
