import { endOfMonth, format, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import BudgetForm from "@/components/BudgetForm";
import { buildBudgetSnapshot } from "@/lib/smart-budget";

export default async function BudgetsPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();

  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");
  const [budgetsResult, transactionsResult, profileResult] = await Promise.all([
    supabase
      .from("budgets")
      .select("id,planned_amount,month,year,category_id,categories(name)")
      .eq("user_id", user.id)
      .eq("month", now.getMonth() + 1)
      .eq("year", now.getFullYear()),
    supabase
      .from("transactions")
      .select("amount,type,category_id,categories(name)")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    supabase
      .from("profiles")
      .select("budget_alert_threshold")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  const snapshot = buildBudgetSnapshot({
    transactions: transactionsResult.data || [],
    budgets: budgetsResult.data || [],
    now,
    alertThreshold: Number(profileResult.data?.budget_alert_threshold) || 80
  });

  return (
    <div>
      <div className="page-head">
        <p className="muted">Plafonds mensuels</p>
        <h1>Budgets</h1>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h3>Définir un budget</h3>
          <BudgetForm />
        </div>

        <div className="card">
          <h3>Ce mois-ci</h3>
          {snapshot.budgets.length ? (
            <div className="grid budget-list">
              {snapshot.budgets.map((budget) => (
                <div className={`budget-line budget-${budget.status}`} key={budget.id}>
                  <div className="split-row">
                    <div>
                      <strong>{budget.categoryName}</strong>
                      <small>
                        {budget.status === "exceeded"
                          ? "Budget dépassé"
                          : budget.status === "warning"
                            ? "Seuil d’alerte atteint"
                            : `Projection : ${euro(budget.projected)}`}
                      </small>
                    </div>
                    <span className="muted">{euro(budget.spent)} / {euro(budget.planned)}</span>
                  </div>
                  <div className="progress" style={{ marginTop: 9 }}>
                    <div style={{ width: `${Math.min(100, budget.percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Crée un premier plafond pour activer les alertes.</p>
          )}
        </div>
      </section>
    </div>
  );
}
