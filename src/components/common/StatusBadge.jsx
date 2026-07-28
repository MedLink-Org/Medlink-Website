import { statusClass } from "../../utils/format";

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${statusClass(status)}`}>
      {status}
    </span>
  );
}
