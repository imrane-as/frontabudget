"use client";

import { FormEvent, useState } from "react";
import { BellRing, CloudSun, MessageCircleMore, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialCity: string;
  initialThreshold: number;
  initialPhone: string;
  initialWhatsAppEnabled: boolean;
  initialWeeklySummaryEnabled: boolean;
};

export default function NotificationSettingsForm({
  initialCity,
  initialThreshold,
  initialPhone,
  initialWhatsAppEnabled,
  initialWeeklySummaryEnabled
}: Props) {
  const [city, setCity] = useState(initialCity);
  const [threshold, setThreshold] = useState(initialThreshold);
  const [phone, setPhone] = useState(initialPhone);
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(initialWhatsAppEnabled);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(
    initialWeeklySummaryEnabled
  );
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validatePhone() {
    return !whatsAppEnabled || /^\+[1-9]\d{7,14}$/.test(phone.trim());
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validatePhone()) {
      setError("Utilise le format international, par exemple +33612345678.");
      return;
    }

    setLoading(true);
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
        whatsapp_phone: phone.trim() || null,
        whatsapp_enabled: whatsAppEnabled,
        weekly_summary_enabled: weeklySummaryEnabled
      })
      .eq("id", data.user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Préférences enregistrées.");
    }

    setLoading(false);
  }

  async function sendTest() {
    setTesting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/notifications/whatsapp", {
        method: "POST"
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Envoi impossible.");
      setMessage(payload.message || "Résumé envoyé sur WhatsApp.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Envoi impossible."
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <form className="form settings-form" onSubmit={save}>
      <div className="setting-group">
        <div className="setting-icon"><CloudSun size={18} /></div>
        <div>
          <strong>Ville météo</strong>
          <p className="muted">La météo générale affichée dans le dashboard.</p>
        </div>
      </div>
      <input
        aria-label="Ville météo"
        value={city}
        maxLength={80}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Metz"
      />

      <div className="setting-group">
        <div className="setting-icon"><BellRing size={18} /></div>
        <div>
          <strong>Seuil d’alerte : {threshold} %</strong>
          <p className="muted">Alerte avant d’atteindre la totalité d’un budget.</p>
        </div>
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

      <div className="setting-group">
        <div className="setting-icon"><MessageCircleMore size={18} /></div>
        <div>
          <strong>WhatsApp</strong>
          <p className="muted">Alertes de budget et résumé de consommation.</p>
        </div>
      </div>

      <label className="toggle-row">
        <span>Activer les notifications WhatsApp</span>
        <input
          type="checkbox"
          checked={whatsAppEnabled}
          onChange={(event) => setWhatsAppEnabled(event.target.checked)}
        />
      </label>

      <label>
        Numéro au format international
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+33612345678"
          autoComplete="tel"
        />
      </label>

      <label className="toggle-row">
        <span>Recevoir le résumé hebdomadaire</span>
        <input
          type="checkbox"
          checked={weeklySummaryEnabled}
          onChange={(event) => setWeeklySummaryEnabled(event.target.checked)}
        />
      </label>

      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}

      <div className="button-row">
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={sendTest}
          disabled={testing || !whatsAppEnabled || !phone}
        >
          <Send size={15} /> {testing ? "Envoi..." : "Envoyer un test"}
        </button>
      </div>
    </form>
  );
}
