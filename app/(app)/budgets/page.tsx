import { endOfMonth, format, startOfMonth } from "date-fns";
import { CalendarDays, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import BudgetForm from "@/components/BudgetForm";
import PageIntro from "@/components/PageIntro";
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
    <div className="page-shell budgets-page">
      <PageIntro
        eyebrow="Plafonds mensuels"
        title="Budgets"
        tone="sun"
        icon={<WalletCards size={26} />}
        description="Donne une mission à chaque euro et garde le contrôle sans te priver."
        aside={<span className="page-feature-pill"><CalendarDays size={14} /> {month}/{year}</span>}
      />

      {(budgetsResult.error || transactionsResult.error || categoriesResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger toutes les données. Recharge la page ou reconnecte-toi.
        </div>
      )}

      <section className="grid grid-2 content-section page-content-grid">
        <div className="card form-feature-card budget-form-card">
          <span className="eyebrow">Planification</span>
          <h3>Définir un budget</h3>
          <p className="muted">Choisis une catégorie et fixe un plafond réaliste.</p>
          <BudgetForm
            categories={categoriesResult.data || []}
            initialMonth={month}
            initialYear={year}
          />
        </div>

        <div className="card budget-overview-card">
          <div className="card-title-row">
            <div><span className="eyebrow">Suivi en direct</span><h3>Budgets de {month}/{year}</h3></div>
            <span className="card-heading-icon card-heading-sun"><WalletCards size={18} /></span>
          </div>
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
            <div className="friendly-empty"><span>🪄</span><strong>Prêt à organiser ton mois</strong><p>Crée un premier plafond pour activer les alertes intelligentes.</p></div>
          )}
        </div>
      </section>
    </div>
  );
}
