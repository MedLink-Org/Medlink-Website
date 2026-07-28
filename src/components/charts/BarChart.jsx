export default function BarChart({ data, monthly = false }) {
  const max = Math.max(...data.map(item => item.value), 1);

  return (
    <div className={`bar-chart ${monthly ? "monthly" : ""}`} aria-label="Patients per day bar chart">
      {data.map((item, index) => (
        <div className="chart-column" key={`${item.label}-${index}`}>
          <div className="chart-column-track">
            <div className="chart-column-bar" style={{ height: `${Math.max(4, (item.value / max) * 88)}%` }}>
              <i className="chart-column-value">{item.value}</i>
            </div>
          </div>
          <span className="chart-column-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
