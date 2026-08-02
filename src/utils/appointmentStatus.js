export const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show"
});

export const APPOINTMENT_STATUSES = Object.freeze(Object.values(APPOINTMENT_STATUS));

const LEGACY_STATUS_MAP = Object.freeze({
  "checked in": APPOINTMENT_STATUS.SCHEDULED,
  "cancelled:": APPOINTMENT_STATUS.CANCELLED
});

export function normalizeAppointmentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const mapped = LEGACY_STATUS_MAP[normalized] || normalized;
  return APPOINTMENT_STATUSES.includes(mapped) ? mapped : APPOINTMENT_STATUS.SCHEDULED;
}

export function appointmentStatusLabel(status) {
  const normalized = normalizeAppointmentStatus(status);
  if (normalized === APPOINTMENT_STATUS.NO_SHOW) return "No-show";
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}

export function toApiAppointmentStatus(status) {
  const normalized = normalizeAppointmentStatus(status);
  if (!APPOINTMENT_STATUSES.includes(normalized)) {
    throw new Error(`Invalid appointment status: "${status}"`);
  }
  return normalized;
}
