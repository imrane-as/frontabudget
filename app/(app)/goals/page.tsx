import { PiggyBank, Sparkles, Target } from "lucide-react";
import GoalForm from "@/components/GoalForm";
import MonthNavigator from "@/components/MonthNavigator";
import PageIntro from "@/components/PageIntro";
import { requireUser } from "@/lib/auth";
import { resolveMonthPeriod } from "@/lib/month-period";
import { euro } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function GoalsPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const period = resolveMonthPeriod(params.month, params.year);

  const [goalsResult, contributionsResult] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("goal_contributions")
      .select("goal_id,amount,contributed_at")
      .eq("user_id", user.id)
      .gte("contributed_at", period.start)
      .lte("contributed_at", period.end)
  ]);
  const goals = goalsResult.data || [];
  const contributions = new Map<string, number>();

  for (const contribution of contributionsResult.data || []) {
    contributions.set(
      contribution.goal_id,
      (contributions.get(contribution.goal_id) || 0) + Number(contribution.amount)
    );
  }

  return (
    <div className="page-shell goals-page">
      <PageIntro
        eyebrow="Épargne et projets"
        title="Objectifs"
        tone="coral"
        icon={<Target size={26} />}
        description="Transforme tes envies en étapes concrètes et célèbre chaque progression."
        aside={<span className="page-feature-pill"><Sparkles size={14} /> {goals.length} projet{goals.length === 1 ? "" : "s"}</span>}
      />

      <MonthNavigator
        basePath="/goals"
        monthKey={period.key}
        periodLabel={period.label}
        previousKey={period.previousKey}
        nextKey={period.nextKey}
        isCurrent={period.isCurrent}
      />

      {(goalsResult.error || contributionsResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger toute la progression de cette période.
        </div>
      )}

      <section className="grid grid-2 content-section page-content-grid">
        <div className="card form-feature-card goal-form-card">
          <span className="eyebrow">Nouveau projet</span>
          <h3>Créer un objectif</h3>
          <p className="muted">Une destination, un montant et tu es déjà en route.</p>
          <GoalForm />
        </div>

        <div className="grid goals-page-list">
          {goals.length ? goals.map((goal, index) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
            const monthlyContribution = contributions.get(goal.id) || 0;

            return (
              <div className={`card goal-project-card goal-project-${index % 3}`} key={goal.id}>
                <div className="goal-project-head"><span><PiggyBank size={19} /></span><strong>{pct.toFixed(0)} %</strong></div>
                <h3>{goal.name}</h3>
                <div className="metric-value">{euro(current)}</div>
                <p className="muted">sur {euro(target)}</p>
                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
                <div className="goal-period-progress">
                  <span>Ajouté en {period.label.toLocaleLowerCase("fr")}</span>
                  <strong>{euro(monthlyContribution)}</strong>
                </div>
              </div>
            );
          }) : <div className="card friendly-empty goal-empty"><span>🌈</span><strong>Ton prochain rêve commence ici</strong><p>Crée un objectif pour voir sa progression prendre vie.</p></div>}
        </div>
      </section>
    </div>
  );
}
