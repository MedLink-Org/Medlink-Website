const colors = ["#2563eb", "#10b981", "#f59e0b", "#dc2626", "#7c3aed"];

export default function DonutChart({ metrics }) {
  const total = metrics.reduce((sum, metric) => sum + metric.count, 0);
  let angle = 0;
  const segments = metrics.map((metric, index) => {
    const degrees = total ? (metric.count / total) * 360 : 0;
    const segment = `${colors[index % colors.length]} ${angle}deg ${angle + degrees}deg`;
    angle += degrees;
    return segment;
  });

  const background = total
    ? `conic-gradient(${segments.join(",")})`
    : "conic-gradient(#e9edf3 0deg 360deg)";

  return (
    <div className="donut-layout">
      <div className="donut-chart" role="img" aria-label="Doctor utilization pie chart" style={{ background }}>
        <div className="donut-center">
          <strong>{total}</strong>
          <span>visits</span>
        </div>
      </div>
      <div className="chart-legend">
        {metrics.map((metric, index) => (
          <div className="legend-item" key={metric.doctor.doctorId}>
            <span className="legend-swatch" style={{ background: colors[index % colors.length] }} />
            <span>Dr. {metric.doctor.lastName}</span>
            <strong>{metric.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
