export default function MetricCard({
  label,
  value,
  detail,
  tone
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "metric-value metric-positive"
      : tone === "negative"
      ? "metric-value metric-negative"
      : "metric-value";

  return (
    <div className="card">
      <div className="metric-label">{label}</div>
      <div className={valueClass}>{value}</div>
      {detail && <div className="kpi-sublabel">{detail}</div>}
    </div>
  );
}
