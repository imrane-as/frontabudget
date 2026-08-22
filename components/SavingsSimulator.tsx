"use client";

import { useState } from "react";
import { ArrowRight, Calculator, Sparkles } from "lucide-react";
import { euro } from "@/lib/money";

export default function SavingsSimulator({ categories }: { categories: Array<{ name: string; amount: number }> }) {
  const options = categories.length ? categories.slice(0, 8) : [{ name: "Restaurants", amount: 200 }];
  const [selectedName, setSelectedName] = useState(options[0].name);
  const [reduction, setReduction] = useState(15);
  const selected = options.find((item) => item.name === selectedName) || options[0];
  const result = selected.amount * (reduction / 100);

  return (
    <div className="card simulator-card">
      <div className="card-title-row">
        <div><span className="eyebrow">Simulation instantanée</span><h3>Et si tu dépensais un peu moins ?</h3></div>
        <Calculator aria-hidden="true" />
      </div>
      <p className="muted">Teste un petit changement et vois son effet sans modifier tes données.</p>

      <div className="simulator-controls">
        <label>Catégorie<select value={selectedName} onChange={(event) => setSelectedName(event.target.value)}>{options.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
        <label>Réduction souhaitée<div className="reduction-display"><strong>{reduction} %</strong><span>sur {euro(selected.amount)}</span></div><input type="range" min="5" max="50" step="5" value={reduction} onChange={(event) => setReduction(Number(event.target.value))} /></label>
      </div>

      <div className="simulation-result">
        <div><span>Économie mensuelle</span><strong>{euro(result)}</strong></div>
        <ArrowRight aria-hidden="true" />
        <div><span>Sur une année</span><strong>{euro(result * 12)}</strong></div>
      </div>
      <div className="simulator-note"><Sparkles size={14} /> Une réduction réaliste et régulière vaut mieux qu’un objectif impossible.</div>
    </div>
  );
}
