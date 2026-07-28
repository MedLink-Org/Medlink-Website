export default function StatCard({ icon: Icon, tone = "blue", label, value, caption, valueClassName = "" }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon stat-icon-${tone}`}>
        <Icon />
      </span>
      <div>
        <span>{label}</span>
        <strong className={valueClassName}>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}
