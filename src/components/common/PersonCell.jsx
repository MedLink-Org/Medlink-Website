import { initials } from "../../utils/format";

export default function PersonCell({ person, title, subtitle, doctor = false, compact = false }) {
  return (
    <div className={compact ? "table-person" : doctor ? "doctor-cell" : "patient-cell"}>
      <span className={`row-avatar ${doctor ? "doctor-avatar" : ""}`}>
        {initials(person?.firstName, person?.lastName)}
      </span>
      <div>
        <strong>{title}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}
