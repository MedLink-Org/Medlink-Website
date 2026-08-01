import {
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  ReceiptText,
  Stethoscope,
  Users
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useMedLink } from "../../context/MedLinkContext";
import { today } from "../../utils/date";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/billing", label: "Billing", icon: ReceiptText },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined }
];

export default function Sidebar({ open, onNavigate }) {
  const { patients, appointments } = useMedLink();
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
        {navigation.map(item => {
          const Icon = item.icon;
          const count = item.label === "Patients"
            ? patients.length
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
        <div className="system-status">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>System online</strong>
            <small>Records synced with server</small>
          </div>
        </div>
        <p>INS 204 Group 13</p>
      </div>
    </aside>
  );
}
