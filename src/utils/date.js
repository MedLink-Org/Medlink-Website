export function toISO(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function fromISO(value) {
  return new Date(`${value}T12:00:00`);
}

export function addDays(value, days) {
  const date = typeof value === "string" ? fromISO(value) : new Date(value);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

export function today() {
  return toISO(new Date());
}

export function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-NG", options).format(fromISO(value));
}

export function formatLongDate(value) {
  return formatDate(value, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatTime(value) {
  if (!value) return "-";
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(new Date(2026, 0, 1, hours, minutes));
}

export function dateRange(endDate, count) {
  return Array.from({ length: count }, (_, index) => addDays(endDate, index - count + 1));
}
