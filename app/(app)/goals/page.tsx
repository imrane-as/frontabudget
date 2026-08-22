import { PiggyBank, Sparkles, Target } from "lucide-react";
import GoalForm from "@/components/GoalForm";
import PageIntro from "@/components/PageIntro";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";

export default async function GoalsPage() {
  const { supabase, user } = await requireUser();

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="page-shell goals-page">
      <PageIntro
        eyebrow="Épargne et projets"
        title="Objectifs"
        tone="coral"
        icon={<Target size={26} />}
        description="Transforme tes envies en étapes concrètes et célèbre chaque progression."
        aside={<span className="page-feature-pill"><Sparkles size={14} /> {goals?.length || 0} projet{goals?.length === 1 ? "" : "s"}</span>}
      />

      <section className="grid grid-2 content-section page-content-grid">
        <div className="card form-feature-card goal-form-card">
          <span className="eyebrow">Nouveau projet</span>
          <h3>Créer un objectif</h3>
          <p className="muted">Une destination, un montant et tu es déjà en route.</p>
          <GoalForm />
        </div>

        <div className="grid goals-page-list">
          {goals?.length ? goals.map((goal, index) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

            return (
              <div className={`card goal-project-card goal-project-${index % 3}`} key={goal.id}>
                <div className="goal-project-head"><span><PiggyBank size={19} /></span><strong>{pct.toFixed(0)} %</strong></div>
                <h3>{goal.name}</h3>
                <div className="metric-value">{euro(current)}</div>
                <p className="muted">sur {euro(target)}</p>
                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          }) : <div className="card friendly-empty goal-empty"><span>🌈</span><strong>Ton prochain rêve commence ici</strong><p>Crée un objectif pour voir sa progression prendre vie.</p></div>}
        </div>
      </section>
    </div>
  );
}
