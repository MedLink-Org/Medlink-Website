import { ChevronDown, CircleDot } from "lucide-react";
import { statusClass } from "../../utils/format";

export default function StatusSelect({
  id,
  name,
  value,
  onChange,
  children,
  className = "",
  ariaLabel
}) {
  const tone = value === "all" ? "all" : statusClass(value);

  return (
    <span className={`status-select status-select-${tone} ${className}`.trim()}>
      <CircleDot aria-hidden="true" />
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
      >
        {children}
      </select>
      <ChevronDown className="status-select-chevron" aria-hidden="true" />
    </span>
  );
}
