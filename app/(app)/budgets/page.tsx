import { endOfMonth, format, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import BudgetForm from "@/components/BudgetForm";
import { buildBudgetSnapshot } from "@/lib/smart-budget";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function BudgetsPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const params = await searchParams;
  const requestedMonth = Number(params.month);
  const requestedYear = Number(params.year);
  const month =
    Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
      ? requestedMonth
      : now.getMonth() + 1;
  const year =
    Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2100
      ? requestedYear
      : now.getFullYear();
  const periodDate = new Date(year, month - 1, 1);
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();
  const analysisDate = isCurrentMonth
    ? now
    : periodDate < startOfMonth(now)
      ? endOfMonth(periodDate)
      : periodDate;

  const start = format(startOfMonth(periodDate), "yyyy-MM-dd");
  const end = format(endOfMonth(periodDate), "yyyy-MM-dd");
  const [budgetsResult, transactionsResult, profileResult, categoriesResult] = await Promise.all([
    supabase
      .from("budgets")
      .select("id,planned_amount,month,year,category_id,categories(name)")
      .eq("user_id", user.id)
      .eq("month", month)
      .eq("year", year),
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
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id,name")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .order("name")
  ]);

  const snapshot = buildBudgetSnapshot({
    transactions: transactionsResult.data || [],
    budgets: budgetsResult.data || [],
    now: analysisDate,
    alertThreshold: Number(profileResult.data?.budget_alert_threshold) || 80
  });

  return (
    <div>
      <div className="page-head">
        <p className="muted">Plafonds mensuels</p>
        <h1>Budgets</h1>
        <p className="muted">Période affichée : {month}/{year}</p>
      </div>

      {(budgetsResult.error || transactionsResult.error || categoriesResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger toutes les données. Recharge la page ou reconnecte-toi.
        </div>
      )}

      <section className="grid grid-2">
        <div className="card">
          <h3>Définir un budget</h3>
          <BudgetForm
            categories={categoriesResult.data || []}
            initialMonth={month}
            initialYear={year}
          />
        </div>

        <div className="card">
          <h3>Budgets de {month}/{year}</h3>
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
