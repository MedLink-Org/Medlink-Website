export default function MiniBarChart({ data }) {
  const max = Math.max(...data.map(item => item.value), 1);

  return (
    <div className="mini-chart" aria-label="Weekly patient attendance chart">
      {data.map(item => (
        <div className="mini-bar-column" key={item.label}>
          <div className="mini-bar-track">
            <div className="mini-bar" style={{ height: `${Math.max(5, (item.value / max) * 88)}%` }}>
              <i className="mini-bar-value">{item.value}</i>
            </div>
          </div>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
