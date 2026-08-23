"use client";

import { useState } from "react";
import { BrainCircuit, RefreshCw, Sparkles } from "lucide-react";

export default function SmartCoach({ initialTips }: { initialTips: string[] }) {
  const [tips, setTips] = useState(initialTips);
  const [source, setSource] = useState<"local" | "ai">("local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshAdvice() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/coach", { method: "POST" });
      const payload = (await response.json()) as {
        tips?: string[];
        source?: "local" | "ai";
        error?: string;
      };

      if (!response.ok || !payload.tips?.length) {
        throw new Error(payload.error || "Analyse indisponible.");
      }

      setTips(payload.tips);
      setSource(payload.source || "local");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Impossible d’actualiser l’analyse."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card coach-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">
            {source === "ai" ? "Analyse approfondie" : "Analyse instantanée"}
          </span>
          <h3>Ton coach budget</h3>
        </div>
        {source === "ai" ? <Sparkles aria-hidden="true" /> : <BrainCircuit aria-hidden="true" />}
      </div>

      <div className="coach-tips">
        {tips.map((tip, index) => (
          <div className="coach-tip" key={`${index}-${tip}`}>
            <span>{index + 1}</span>
            <p>{tip}</p>
          </div>
        ))}
      </div>

      {error && <p className="inline-error">{error}</p>}

      <button className="btn btn-compact" onClick={refreshAdvice} disabled={loading}>
        <RefreshCw size={15} className={loading ? "spin" : ""} />
        {loading ? "Analyse..." : "Affiner les conseils"}
      </button>
      <p className="microcopy">
        L’analyse approfondie est lancée seulement à ta demande et utilise uniquement tes totaux.
      </p>
    </div>
  );
}
