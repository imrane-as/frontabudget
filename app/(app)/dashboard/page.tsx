import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import MetricCard from "@/components/MetricCard";
import DashboardChart from "@/components/DashboardChart";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: current } = await supabase
    .from("transactions")
    .select("amount,type,transaction_date")
    .eq("user_id", user.id)
    .gte("transaction_date", monthStart)
    .lte("transaction_date", monthEnd);

  const income =
    current
      ?.filter((x) => x.type === "income")
      .reduce((sum, x) => sum + Number(x.amount), 0) ?? 0;

  const expenses =
    current
      ?.filter((x) => x.type === "expense")
      .reduce((sum, x) => sum + Number(x.amount), 0) ?? 0;

  const remaining = income - expenses;
  const savingRate = income > 0 ? Math.max(0, (remaining / income) * 100) : 0;

  const chartData = [];

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("amount,type")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lte("transaction_date", end);

    chartData.push({
      name: format(date, "MMM", { locale: fr }),
      revenus:
        data
          ?.filter((x) => x.type === "income")
          .reduce((sum, x) => sum + Number(x.amount), 0) ?? 0,
      depenses:
        data
          ?.filter((x) => x.type === "expense")
          .reduce((sum, x) => sum + Number(x.amount), 0) ?? 0
    });
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div>
      <div className="page-head">
        <p className="muted">{format(now, "MMMM yyyy", { locale: fr })}</p>
        <h1>Mon dashboard</h1>
      </div>

      <section className="grid grid-4">
        <MetricCard label="Revenus" value={euro(income)} />
        <MetricCard label="Dépenses" value={euro(expenses)} tone="negative" />
        <MetricCard
          label="Disponible"
          value={euro(remaining)}
          tone={remaining >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Taux d’épargne"
          value={`${savingRate.toFixed(1)} %`}
          detail="après dépenses enregistrées"
        />
      </section>

      <section className="grid grid-2 section">
        <div className="card">
          <h3>Évolution sur 6 mois</h3>
          <p className="muted">Revenus et dépenses enregistrés</p>
          <DashboardChart data={chartData} />
        </div>

        <div className="card">
          <h3>Objectifs d’épargne</h3>
          <p className="muted">Tes principaux objectifs</p>

          {goals?.length ? (
            <div className="grid">
              {goals.map((goal) => {
                const currentAmount = Number(goal.current_amount);
                const targetAmount = Number(goal.target_amount);
                const progress =
                  targetAmount > 0
                    ? Math.min(100, (currentAmount / targetAmount) * 100)
                    : 0;

                return (
                  <div key={goal.id}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{goal.name}</strong>
                      <span className="muted">
                        {euro(currentAmount)} / {euro(targetAmount)}
                      </span>
                    </div>
                    <div className="progress" style={{ marginTop: 9 }}>
                      <div style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Ajoute ton premier objectif pour suivre ta progression.</p>
          )}
        </div>
      </section>
    </div>
  );
}
