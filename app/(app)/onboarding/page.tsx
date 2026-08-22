"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [residence, setResidence] = useState("France");
  const [workCountry, setWorkCountry] = useState("Luxembourg");
  const [salary, setSalary] = useState("3250");
  const [goal, setGoal] = useState("Comprendre mes dépenses");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amount = Number(salary) || 0;
    const today = new Date().toISOString().slice(0, 10);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        residence_country: residence,
        work_country: workCountry,
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
    <div>
      <div className="page-head">
        <p className="muted">Configuration initiale</p>
        <h1>Bienvenue sur FrontaBudget 👋</h1>
      </div>

      <div className="card" style={{ maxWidth: 700 }}>
        <form className="form" onSubmit={submit}>
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
            Objectif principal
            <select value={goal} onChange={(e) => setGoal(e.target.value)}>
              <option>Comprendre mes dépenses</option>
              <option>Épargner davantage</option>
              <option>Préparer un voyage</option>
              <option>Acheter un logement</option>
              <option>Gérer mon budget</option>
            </select>
          </label>

          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Configuration..." : "Créer mon espace"}
          </button>
        </form>
      </div>
    </div>
  );
}
