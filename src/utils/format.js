export function initials(firstName = "", lastName = "") {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "PT";
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(Number(amount) || 0);
}

export function statusClass(status = "") {
  return status.toLowerCase().replace(/\s+/g, "-");
}

export function doctorName(doctor) {
  return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "Unassigned doctor";
}
