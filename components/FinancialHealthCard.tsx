import { Check, TrendingUp, TriangleAlert } from "lucide-react";
import type { FinancialHealth } from "@/lib/smart-budget";

export default function FinancialHealthCard({ health }: { health: FinancialHealth }) {
  const color = health.score >= 80 ? "#34d399" : health.score >= 65 ? "#60a5fa" : health.score >= 45 ? "#fbbf24" : "#fb7185";

  return (
    <div className="health-card-inner">
      <div className="score-ring" style={{ background: `conic-gradient(${color} ${health.score * 3.6}deg, var(--ring-track) 0deg)` }}>
        <div>
          <strong>{health.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div className="health-copy">
        <span className="health-label"><TrendingUp size={14} /> Santé financière · {health.label}</span>
        <p>{health.summary}</p>
        <div className="health-signals">
          {health.signals.slice(0, 3).map((signal) => (
            <span key={signal.label} className={signal.positive ? "positive" : "attention"}>
              {signal.positive ? <Check size={13} /> : <TriangleAlert size={13} />}
              {signal.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
