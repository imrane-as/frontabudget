import type { ReactNode } from "react";

export default function MetricCard({
  label,
  value,
  detail,
  tone,
  accent = "emerald",
  icon
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "positive" | "negative";
  accent?: "emerald" | "rose" | "blue" | "violet";
  icon?: ReactNode;
}) {
  const valueClass =
    tone === "positive"
      ? "metric-value metric-positive"
      : tone === "negative"
      ? "metric-value metric-negative"
      : "metric-value";

  return (
    <div className={`card metric-card accent-${accent}`}>
      <div className="metric-top"><div className="metric-label">{label}</div>{icon && <span className="metric-icon">{icon}</span>}</div>
      <div className={valueClass}>{value}</div>
      {detail && <div className="kpi-sublabel">{detail}</div>}
    </div>
  );
}
