"use client";

import { FormEvent, useState } from "react";
import { BellRing, CloudSun, PiggyBank, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialCity: string;
  initialThreshold: number;
  initialSavingsTarget: number;
};

export default function SmartPreferencesForm({
  initialCity,
  initialThreshold,
  initialSavingsTarget
}: Props) {
  const [city, setCity] = useState(initialCity);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [savingsTarget, setSavingsTarget] = useState(initialSavingsTarget);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setError("Ta session a expiré.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        weather_city: city.trim() || "Metz",
        budget_alert_threshold: threshold,
        monthly_savings_target: Math.max(0, savingsTarget)
      })
      .eq("id", data.user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Tes préférences sont enregistrées.");
    }

    setLoading(false);
  }

  return (
    <form className="form settings-form" onSubmit={save}>
      <div className="preference-grid">
        <label className="preference-card">
          <span className="setting-icon weather-setting"><CloudSun size={19} /></span>
          <span>
            <strong>Ville météo</strong>
            <small>Pour les prévisions et les conseils de déplacement.</small>
          </span>
          <input
            value={city}
            maxLength={80}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Metz"
          />
        </label>

        <label className="preference-card">
          <span className="setting-icon savings-setting"><PiggyBank size={19} /></span>
          <span>
            <strong>Épargne à protéger</strong>
            <small>Réservée avant de calculer ce que tu peux dépenser.</small>
          </span>
          <div className="input-with-unit">
            <input
              type="number"
              min="0"
              step="10"
              value={savingsTarget}
              onChange={(event) => setSavingsTarget(Number(event.target.value))}
            />
            <span>€/mois</span>
          </div>
        </label>
      </div>

      <div className="threshold-panel">
        <div className="setting-group">
          <span className="setting-icon alert-setting"><BellRing size={19} /></span>
          <div>
            <strong>Seuil d’alerte budget</strong>
            <p className="muted">Le dashboard te prévient à partir de {threshold} %.</p>
          </div>
          <span className="threshold-value">{threshold} %</span>
        </div>
        <input
          aria-label="Seuil d’alerte budget"
          type="range"
          min="50"
          max="100"
          step="5"
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />
        <div className="range-labels"><span>Prudent</span><span>Souple</span></div>
      </div>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <button className="btn btn-primary save-preferences" disabled={loading}>
        <Save size={16} />
        {loading ? "Enregistrement..." : "Enregistrer les préférences"}
      </button>
    </form>
  );
}
