import { statusClass } from "../../utils/format";
import {
  APPOINTMENT_STATUSES,
  appointmentStatusLabel
} from "../../utils/appointmentStatus";

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const label = APPOINTMENT_STATUSES.includes(normalizedStatus)
    ? appointmentStatusLabel(normalizedStatus)
    : String(status || "");

  return (
    <span className={`status-badge status-${statusClass(status)}`}>
      {label}
    </span>
  );
}
