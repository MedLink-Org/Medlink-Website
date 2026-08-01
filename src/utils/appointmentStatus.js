export const APPOINTMENT_STATUS = Object.freeze({
  SCHEDULED: "scheduled",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no-show"
});

export const APPOINTMENT_STATUSES = Object.freeze(Object.values(APPOINTMENT_STATUS));

const LEGACY_STATUS_MAP = Object.freeze({
  "checked in": APPOINTMENT_STATUS.SCHEDULED,
  canceled: APPOINTMENT_STATUS.CANCELLED
});

export function normalizeAppointmentStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return LEGACY_STATUS_MAP[normalized] || normalized;
}

export function appointmentStatusLabel(status) {
  const normalized = normalizeAppointmentStatus(status);
  if (normalized === APPOINTMENT_STATUS.NO_SHOW) return "No-show";
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
}
