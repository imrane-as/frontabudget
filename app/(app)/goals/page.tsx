import GoalForm from "@/components/GoalForm";
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
    <div>
      <div className="page-head">
        <p className="muted">Épargne et projets</p>
        <h1>Objectifs</h1>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h3>Nouvel objectif</h3>
          <GoalForm />
        </div>

        <div className="grid">
          {goals?.map((goal) => {
            const current = Number(goal.current_amount);
            const target = Number(goal.target_amount);
            const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

            return (
              <div className="card" key={goal.id}>
                <h3>{goal.name}</h3>
                <div className="metric-value">{euro(current)}</div>
                <p className="muted">sur {euro(target)}</p>
                <div className="progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
