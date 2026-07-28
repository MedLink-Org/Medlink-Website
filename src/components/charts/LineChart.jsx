export default function LineChart({ data }) {
  const width = 1000;
  const height = 210;
  const paddingX = 45;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartHeight = height - paddingTop - paddingBottom;
  const max = Math.max(...data.map(item => item.value), 1);
  const step = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;
  const points = data.map((item, index) => ({
    ...item,
    x: paddingX + step * index,
    y: paddingTop + chartHeight - (item.value / max) * chartHeight
  }));
  const pointString = points.map(point => `${point.x},${point.y}`).join(" ");
  const areaPoints = `${paddingX},${paddingTop + chartHeight} ${pointString} ${width - paddingX},${paddingTop + chartHeight}`;

  return (
    <div className="line-chart" aria-label="Attendance trend line chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Completed attendance trend">
        {Array.from({ length: 5 }, (_, index) => {
          const y = paddingTop + (chartHeight / 4) * index;
          return <line className="line-grid" x1={paddingX} y1={y} x2={width - paddingX} y2={y} key={y} />;
        })}
        <polygon className="line-area" points={areaPoints} />
        <polyline className="line-path" points={pointString} />
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <text className="line-label" x={point.x} y={height - 8} textAnchor="middle">{point.label}</text>
            <circle className="line-point" cx={point.x} cy={point.y} r="4" />
          </g>
        ))}
      </svg>
    </div>
  );
}
