export const ROLES = Object.freeze({
  STAFF: "staff",
  DOCTOR: "doctor",
  NURSE: "nurse",
  PATIENT: "patient"
});

export const PERMISSIONS = Object.freeze({
  DASHBOARD_VIEW: "dashboard.view",
  PATIENTS_VIEW: "patients.view",
  PATIENTS_MANAGE: "patients.manage",
  DOCTORS_VIEW: "doctors.view",
  DOCTORS_MANAGE: "doctors.manage",
  NURSES_VIEW: "nurses.view",
  NURSES_MANAGE: "nurses.manage",
  APPOINTMENTS_VIEW: "appointments.view",
  APPOINTMENTS_CREATE: "appointments.create",
  APPOINTMENTS_UPDATE: "appointments.update",
  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",
  REPORTS_VIEW: "reports.view",
  MEDICAL_RECORDS_VIEW: "medicalRecords.view",
  STAFF_VIEW: "staff.view"
});

const rolePermissions = {
  [ROLES.STAFF]: Object.values(PERMISSIONS),
  [ROLES.DOCTOR]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.DOCTORS_VIEW,
    PERMISSIONS.NURSES_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.MEDICAL_RECORDS_VIEW
  ],
  [ROLES.NURSE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PATIENTS_VIEW,
    PERMISSIONS.DOCTORS_VIEW,
    PERMISSIONS.NURSES_VIEW,
    PERMISSIONS.APPOINTMENTS_VIEW,
    PERMISSIONS.APPOINTMENTS_UPDATE,
    PERMISSIONS.MEDICAL_RECORDS_VIEW
  ],
  [ROLES.PATIENT]: [
    PERMISSIONS.PATIENTS_VIEW
  ]
};

const roleLabels = {
  [ROLES.STAFF]: "Clinic Staff",
  [ROLES.DOCTOR]: "Doctor",
  [ROLES.NURSE]: "Nurse",
  [ROLES.PATIENT]: "Patient"
};

export function normalizeRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(rolePermissions, normalized)
    ? normalized
    : "";
}

export function permissionsForRole(role) {
  return rolePermissions[normalizeRole(role)] || [];
}

export function hasPermission(role, permission) {
  return permissionsForRole(role).includes(permission);
}

export function roleLabel(role) {
  return roleLabels[normalizeRole(role)] || "MedLink User";
}

export function defaultRouteForRole(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === ROLES.PATIENT) return "/patients";
  return hasPermission(normalizedRole, PERMISSIONS.DASHBOARD_VIEW) ? "/" : "/login";
}
