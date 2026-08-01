import { statusClass } from "../../utils/format";
import { appointmentStatusLabel } from "../../utils/appointmentStatus";

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${statusClass(status)}`}>
      {appointmentStatusLabel(status)}
    </span>
  );
}
