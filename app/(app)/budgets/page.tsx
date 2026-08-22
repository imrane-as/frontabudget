import { endOfMonth, format, startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import BudgetForm from "@/components/BudgetForm";

export default async function BudgetsPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();

  const { data: budgets } = await supabase
    .from("budgets")
    .select("id,planned_amount,month,year,category_id,categories(name)")
    .eq("user_id", user.id)
    .eq("month", now.getMonth() + 1)
    .eq("year", now.getFullYear());

  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: expenses } = await supabase
    .from("transactions")
    .select("amount,category_id")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("transaction_date", start)
    .lte("transaction_date", end);

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
          <div className="grid">
            {budgets?.map((budget) => {
              const spent =
                expenses
                  ?.filter((x) => x.category_id === budget.category_id)
                  .reduce((sum, x) => sum + Number(x.amount), 0) ?? 0;

              const planned = Number(budget.planned_amount);
              const pct = planned > 0 ? Math.min(100, (spent / planned) * 100) : 0;

              return (
                <div key={budget.id}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{(budget.categories as unknown as { name: string } | null)?.name || "Catégorie"}</strong>
                    <span className="muted">{euro(spent)} / {euro(planned)}</span>
                  </div>
                  <div className="progress" style={{ marginTop: 9 }}>
                    <div style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
