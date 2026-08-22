import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import BudgetAlerts from "@/components/BudgetAlerts";
import DashboardChart from "@/components/DashboardChart";
import MetricCard from "@/components/MetricCard";
import SmartCoach from "@/components/SmartCoach";
import WeatherCard from "@/components/WeatherCard";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import { buildBudgetSnapshot, buildLocalInsights } from "@/lib/smart-budget";
import { getWeather } from "@/lib/weather";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const historyStart = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,weather_city,budget_alert_threshold")
    .eq("id", user.id)
    .maybeSingle();

  const alertThreshold = Number(profile?.budget_alert_threshold) || 80;
  const [transactionsResult, budgetsResult, goalsResult, weather] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("amount,type,transaction_date,category_id,categories(name)")
        .eq("user_id", user.id)
        .gte("transaction_date", historyStart)
        .lte("transaction_date", monthEnd),
      supabase
        .from("budgets")
        .select("id,planned_amount,category_id,categories(name)")
        .eq("user_id", user.id)
        .eq("month", now.getMonth() + 1)
        .eq("year", now.getFullYear()),
      supabase
        .from("goals")
        .select("id,name,current_amount,target_amount")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      getWeather(profile?.weather_city || "Metz")
    ]);

  const allTransactions = transactionsResult.data || [];
  const currentTransactions = allTransactions.filter(
    (transaction) =>
      transaction.transaction_date >= monthStart &&
      transaction.transaction_date <= monthEnd
  );
  const snapshot = buildBudgetSnapshot({
    transactions: currentTransactions,
    budgets: budgetsResult.data || [],
    now,
    alertThreshold
  });

  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");
    const monthTransactions = allTransactions.filter(
      (transaction) =>
        transaction.transaction_date >= start &&
        transaction.transaction_date <= end
    );

    chartData.push({
      name: format(date, "MMM", { locale: fr }),
      revenus: monthTransactions
        .filter((transaction) => transaction.type === "income")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      depenses: monthTransactions
        .filter((transaction) => transaction.type === "expense")
        .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    });
  }

  const goals = goalsResult.data || [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];

  return (
    <div>
      <div className="dashboard-head">
        <div className="page-head">
          <p className="muted">{format(now, "MMMM yyyy", { locale: fr })}</p>
          <h1>{firstName ? `Bonjour ${firstName} 👋` : "Mon dashboard"}</h1>
          <p className="muted">Voici l’essentiel pour décider sans ouvrir un tableur.</p>
        </div>
        <div className="month-pill">Jour {snapshot.dayOfMonth} sur {snapshot.daysInMonth}</div>
      </div>

      <BudgetAlerts budgets={snapshot.budgets} />

      <section className="grid grid-4 section">
        <MetricCard label="Revenus" value={euro(snapshot.income)} detail="ce mois-ci" />
        <MetricCard
          label="Dépenses"
          value={euro(snapshot.expenses)}
          detail={`${euro(snapshot.dailySpend)} / jour`}
          tone="negative"
        />
        <MetricCard
          label="Disponible"
          value={euro(snapshot.remaining)}
          detail={`projection dépenses ${euro(snapshot.projectedExpenses)}`}
          tone={snapshot.remaining >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Taux d’épargne"
          value={`${snapshot.savingRate.toFixed(1)} %`}
          detail="après dépenses enregistrées"
        />
      </section>

      <section className="grid grid-2 section smart-grid">
        <SmartCoach initialTips={buildLocalInsights(snapshot)} />
        <WeatherCard weather={weather} />
      </section>

      <section className="grid grid-2 section">
        <div className="card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">Tendance</span>
              <h3>Évolution sur 6 mois</h3>
            </div>
          </div>
          <p className="muted">Revenus et dépenses enregistrés</p>
          <DashboardChart data={chartData} />
        </div>

        <div className="card">
          <span className="eyebrow">Progression</span>
          <h3>Objectifs d’épargne</h3>
          <p className="muted">Tes principaux objectifs</p>

          {goals.length ? (
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
                    <div className="split-row">
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
