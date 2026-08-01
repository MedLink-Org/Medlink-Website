import {
  BriefcaseMedical,
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  ReceiptText,
  Stethoscope,
  UserRound,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { hasPermission, PERMISSIONS } from "../../auth/accessControl";
import { useAuth } from "../../context/AuthContext";
import { useMedLink } from "../../context/MedLinkContext";
import { today } from "../../utils/date";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, permission: PERMISSIONS.DASHBOARD_VIEW },
  { to: "/patients", label: "Patients", icon: Users, permission: PERMISSIONS.PATIENTS_VIEW },
  { to: "/doctors", label: "Doctors", icon: UserRound, permission: PERMISSIONS.DOCTORS_VIEW },
  { to: "/nurses", label: "Nurses", icon: BriefcaseMedical, permission: PERMISSIONS.NURSES_VIEW },
  { to: "/appointments", label: "Appointments", icon: CalendarDays, permission: PERMISSIONS.APPOINTMENTS_VIEW },
  { to: "/billing", label: "Billing", icon: ReceiptText, permission: PERMISSIONS.BILLING_VIEW },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined, permission: PERMISSIONS.REPORTS_VIEW }
];

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();
  const {
    patients,
    doctors,
    nurses,
    appointments,
    error,
    offlineEnabled
  } = useMedLink();
  const pendingAppointments = appointments.filter(appointment =>
    appointment.date >= today() && !["Completed", "Cancelled"].includes(appointment.status)
  ).length;

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Primary navigation">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true"><Stethoscope /></span>
        <span className="brand-copy">
          <strong>MedLink</strong>
          <small>Clinic Management</small>
        </span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Workspace</span>
        {navigation.filter(item => hasPermission(user?.role, item.permission)).map(item => {
          const Icon = item.icon;
          const count = item.label === "Patients"
            ? patients.length
            : item.label === "Doctors"
              ? doctors.length
              : item.label === "Nurses"
                ? nurses.length
                : item.label === "Appointments"
                  ? pendingAppointments
                  : null;

          return (
            <NavLink
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              end={item.end}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon />
              <span>{item.label}</span>
              {count !== null && <span className="nav-count">{count}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`system-status ${error ? "offline" : ""}`}>
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>{error ? (offlineEnabled ? "Local records" : "API unavailable") : "System online"}</strong>
            <small>{error
              ? (offlineEnabled ? "Changes stay on this device" : "Reconnect to view records")
              : "Records synced with server"}</small>
          </div>
        </div>
        <p>INS 204 Group 13</p>
      </div>
    </aside>
  );
}
