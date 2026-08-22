"use client";

import { FormEvent, useState } from "react";
import { Check, MapPinned, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import PageIntro from "@/components/PageIntro";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const [residence, setResidence] = useState("France");
  const [workCountry, setWorkCountry] = useState("Luxembourg");
  const [weatherCity, setWeatherCity] = useState("Metz");
  const [salary, setSalary] = useState("3250");
  const [savingsTarget, setSavingsTarget] = useState("300");
  const [goal, setGoal] = useState("Comprendre mes dépenses");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amount = Number(salary) || 0;
    const today = new Date().toISOString().slice(0, 10);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        residence_country: residence,
        work_country: workCountry,
        weather_city: weatherCity.trim() || "Metz",
        monthly_savings_target: Number(savingsTarget) || 0,
        primary_goal: goal,
        onboarding_completed: true
      })
      .eq("id", user.id);

    if (!profileError && amount > 0) {
      await supabase.from("recurring_transactions").insert({
        user_id: user.id,
        name: "Salaire",
        amount,
        type: "income",
        frequency: "monthly",
        next_execution_date: today,
        active: true
      });
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="page-shell onboarding-page">
      <PageIntro
        eyebrow="Configuration initiale"
        title="Bienvenue sur FrontaBudget 👋"
        tone="mint"
        icon={<Sparkles size={26} />}
        description="Quelques informations suffisent pour créer un espace vraiment adapté à ta vie de frontalier."
        aside={<span className="page-feature-pill"><ShieldCheck size={14} /> Données privées</span>}
      />

      <section className="onboarding-grid content-section">
      <div className="card onboarding-form-card form-feature-card">
        <div className="onboarding-step"><span>Étape 1 sur 1</span><div><i /><i /><i /></div></div>
        <h3>Personnalise ton espace</h3>
        <p className="muted">Tu pourras modifier ces choix à tout moment dans les paramètres.</p>
        <form className="form" onSubmit={submit}>
          <div className="onboarding-fields">
          <label>
            Pays de résidence
            <select value={residence} onChange={(e) => setResidence(e.target.value)}>
              <option>France</option>
              <option>Belgique</option>
              <option>Allemagne</option>
            </select>
          </label>

          <label>
            Pays de travail
            <select value={workCountry} onChange={(e) => setWorkCountry(e.target.value)}>
              <option>Luxembourg</option>
            </select>
          </label>

          <label>
            Ville pour la météo générale
            <input
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              placeholder="Metz"
              maxLength={80}
            />
          </label>

          <label>
            Salaire net mensuel (€)
            <input
              type="number"
              min="0"
              step="0.01"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
            />
          </label>

          <label>
            Épargne à protéger chaque mois (€)
            <input
              type="number"
              min="0"
              step="10"
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
            />
          </label>

          <label>
            Objectif principal
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>Comprendre mes dépenses</option>
              <option>Épargner davantage</option>
              <option>Préparer un voyage</option>
              <option>Acheter un logement</option>
              <option>Gérer mon budget</option>
            </select>
          </label>
          </div>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Configuration..." : "Créer mon espace"}
          </button>
        </form>
      </div>

      <aside className="card onboarding-benefits">
        <div className="onboarding-benefits-visual"><span>🌱</span><i /><i /></div>
        <span className="eyebrow">Ton espace évolue avec toi</span>
        <h3>Un budget utile dès le premier jour</h3>
        <div className="onboarding-benefit-list">
          <div><span><Wallet size={16} /></span><p><strong>Budget protégé</strong><small>Ton épargne reste visible avant chaque décision.</small></p><Check size={15} /></div>
          <div><span><MapPinned size={16} /></span><p><strong>Vie frontalière</strong><small>Trajets et journées Luxembourg au même endroit.</small></p><Check size={15} /></div>
          <div><span><Sparkles size={16} /></span><p><strong>Conseils intelligents</strong><small>Des recommandations simples, jamais envahissantes.</small></p><Check size={15} /></div>
        </div>
      </aside>
      </section>
    </div>
  );
}
