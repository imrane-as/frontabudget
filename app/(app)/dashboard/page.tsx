import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Gauge,
  Plus,
  Sparkles,
  Target,
  Wallet
} from "lucide-react";
import BudgetAlerts from "@/components/BudgetAlerts";
import DashboardChart from "@/components/DashboardChart";
import FinancialHealthCard from "@/components/FinancialHealthCard";
import GroceryMarketCard from "@/components/GroceryMarketCard";
import IncomeIdeasCard from "@/components/IncomeIdeasCard";
import MetricCard from "@/components/MetricCard";
import MonthNavigator from "@/components/MonthNavigator";
import SavingsSimulator from "@/components/SavingsSimulator";
import SmartCoach from "@/components/SmartCoach";
import SpendingDonut from "@/components/SpendingDonut";
import WeatherCard from "@/components/WeatherCard";
import { requireUser } from "@/lib/auth";
import { getGroceryMarket } from "@/lib/grocery-market";
import { resolveMonthPeriod } from "@/lib/month-period";
import { euro } from "@/lib/money";
import { buildBudgetSnapshot, buildLocalInsights, calculateFinancialHealth } from "@/lib/smart-budget";
import { getWeather } from "@/lib/weather";

type DashboardProfile = {
  full_name: string | null;
  weather_city: string | null;
  budget_alert_threshold: number | null;
  monthly_savings_target: number | string | null;
  birth_year?: number | null;
  household_size?: number | null;
  employment_status?: "employee" | "self_employed" | "student" | "job_seeker" | "retired" | "other" | null;
  skills?: string | null;
  grocery_budget_weekly?: number | string | null;
};

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const params = await searchParams;
  const period = resolveMonthPeriod(params.month, params.year, now);
  const monthStart = period.start;
  const monthEnd = period.end;
  const historyStart = format(startOfMonth(subMonths(period.date, 5)), "yyyy-MM-dd");
  const analysisDate = period.isCurrent ? now : endOfMonth(period.date);

  const extendedProfileResult = await supabase
    .from("profiles")
    .select("full_name,weather_city,budget_alert_threshold,monthly_savings_target,birth_year,household_size,employment_status,skills,grocery_budget_weekly")
    .eq("id", user.id)
    .maybeSingle();

  let profile = extendedProfileResult.data as DashboardProfile | null;
  if (extendedProfileResult.error) {
    const fallbackProfileResult = await supabase
      .from("profiles")
      .select("full_name,weather_city,budget_alert_threshold,monthly_savings_target")
      .eq("id", user.id)
      .maybeSingle();
    profile = fallbackProfileResult.data as DashboardProfile | null;
  }

  const alertThreshold = Number(profile?.budget_alert_threshold) || 80;
  const monthlySavingsTarget = Number(profile?.monthly_savings_target) || 300;
  const city = profile?.weather_city || "Metz";
  const [transactionsResult, budgetsResult, goalsResult, weather, groceryMarket] = await Promise.all([
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
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("goals")
      .select("id,name,current_amount,target_amount")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    getWeather(city),
    getGroceryMarket(city)
  ]);

  const allTransactions = transactionsResult.data || [];
  const currentTransactions = allTransactions.filter(
    (transaction) =>
      transaction.transaction_date >= monthStart && transaction.transaction_date <= monthEnd
  );
  const snapshot = buildBudgetSnapshot({
    transactions: currentTransactions,
    budgets: budgetsResult.data || [],
    now: analysisDate,
    alertThreshold,
    monthlySavingsTarget
  });
  const health = calculateFinancialHealth(snapshot);
  const monthlyGrocerySpent = snapshot.categories.find(
    (category) => category.name.toLocaleLowerCase("fr") === "courses"
  )?.amount || 0;

  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(period.date, i);
    const start = format(startOfMonth(date), "yyyy-MM-dd");
    const end = format(endOfMonth(date), "yyyy-MM-dd");
    const monthTransactions = allTransactions.filter(
      (transaction) => transaction.transaction_date >= start && transaction.transaction_date <= end
    );
    chartData.push({
      name: format(date, "MMM", { locale: fr }),
      revenus: monthTransactions.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      depenses: monthTransactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + Number(transaction.amount), 0)
    });
  }

  const goals = goalsResult.data || [];
  const firstName = profile?.full_name?.trim().split(/\s+/)[0];
  const monthProgress = Math.min(
    100,
    Math.max(0, (snapshot.dayOfMonth / snapshot.daysInMonth) * 100)
  );

  return (
    <div className="dashboard-page">
      <section className="dashboard-command-center">
        <div className="dashboard-head">
          <div className="page-head">
            <span className="dashboard-date">
              {period.isCurrent
                ? format(now, "EEEE d MMMM", { locale: fr })
                : `Bilan historique · ${period.label}`}
            </span>
            <h1>{firstName ? `Bonjour ${firstName}` : "Mon dashboard"}<span className="wave">👋</span></h1>
            <p className="muted">
              {period.isCurrent
                ? "Ton argent devient plus simple, plus clair et plus motivant."
                : `Voici le résumé complet de ${period.label.toLocaleLowerCase("fr")}.`}
            </p>
          </div>
          <div className="month-progress-card">
            <div>
              <span>{period.isCurrent ? "Progression du mois" : "Mois clôturé"}</span>
              <strong>{Math.round(monthProgress)} %</strong>
            </div>
            <div className="month-progress-track"><span style={{ width: `${monthProgress}%` }} /></div>
            <small>{period.isCurrent ? `Jour ${snapshot.dayOfMonth} sur ${snapshot.daysInMonth}` : period.label}</small>
          </div>
        </div>

        <MonthNavigator
          basePath="/dashboard"
          monthKey={period.key}
          periodLabel={period.label}
          previousKey={period.previousKey}
          nextKey={period.nextKey}
          isCurrent={period.isCurrent}
          reportHref={`/api/reports/monthly?month=${period.month}&year=${period.year}`}
        />
      </section>

      <nav className="dashboard-quick-actions" aria-label="Actions rapides">
        <Link href={`/transactions?month=${period.month}&year=${period.year}`}>
          <span className="quick-action-icon quick-action-mint"><Plus size={19} /></span>
          <span><strong>Ajouter</strong><small>Une opération</small></span>
          <ArrowRight size={16} />
        </Link>
        <Link href={`/budgets?month=${period.month}&year=${period.year}`}>
          <span className="quick-action-icon quick-action-sun"><Wallet size={19} /></span>
          <span><strong>Planifier</strong><small>Un budget</small></span>
          <ArrowRight size={16} />
        </Link>
        <Link href={`/goals?month=${period.month}&year=${period.year}`}>
          <span className="quick-action-icon quick-action-violet"><Target size={19} /></span>
          <span><strong>Créer</strong><small>Un objectif</small></span>
          <ArrowRight size={16} />
        </Link>
      </nav>

      <section className="dashboard-overview-grid section">
        <div className="finance-hero">
          <span className="finance-hero-orb finance-hero-orb-one" aria-hidden="true" />
          <span className="finance-hero-orb finance-hero-orb-two" aria-hidden="true" />
          <div className="finance-hero-main">
            <span className="hero-kicker"><Sparkles size={15} /> {period.isCurrent ? "Budget disponible" : "Bilan du mois"}</span>
            <p>{period.isCurrent ? "Tu peux encore dépenser" : "Solde après les dépenses"}</p>
            <strong>{euro(period.isCurrent ? snapshot.safeToSpend : snapshot.remaining)}</strong>
            <span className="hero-explanation">
              {period.isCurrent
                ? `après avoir protégé ${euro(snapshot.monthlySavingsTarget)} d’épargne`
                : `${euro(snapshot.income)} de revenus et ${euro(snapshot.expenses)} de dépenses`}
            </span>
            <div className="safe-spend-grid">
              {period.isCurrent ? (
                <>
                  <div><span>Par jour</span><strong>{euro(snapshot.safeToSpendDaily)}</strong><small>{snapshot.daysRemaining} jours restants</small></div>
                  <div><span>Par semaine</span><strong>{euro(snapshot.safeToSpendWeekly)}</strong><small>rythme conseillé</small></div>
                  <div><span>Projection</span><strong>{euro(snapshot.projectedExpenses)}</strong><small>fin de mois</small></div>
                </>
              ) : (
                <>
                  <div><span>Épargne nette</span><strong>{euro(snapshot.remaining)}</strong><small>revenus moins dépenses</small></div>
                  <div><span>Taux d’épargne</span><strong>{Math.round(snapshot.savingRate)} %</strong><small>sur les revenus</small></div>
                  <div><span>Dépenses</span><strong>{euro(snapshot.expenses)}</strong><small>total du mois</small></div>
                </>
              )}
            </div>
          </div>
          <FinancialHealthCard health={health} />
        </div>
        <WeatherCard weather={weather} city={city} />
      </section>

      <BudgetAlerts budgets={snapshot.budgets} />

      <section className="grid grid-3 section metric-grid metric-grid-condensed">
        <MetricCard label="Revenus" value={euro(snapshot.income)} detail={period.label} accent="emerald" icon={<ArrowUpRight size={18} />} />
        <MetricCard label="Dépenses" value={euro(snapshot.expenses)} detail={`${euro(snapshot.dailySpend)} / jour`} tone="negative" accent="rose" icon={<ArrowDownRight size={18} />} />
        <MetricCard label={period.isCurrent ? "Solde actuel" : "Épargne nette"} value={euro(snapshot.remaining)} detail={period.isCurrent ? "avant épargne protégée" : "revenus moins dépenses"} tone={snapshot.remaining >= 0 ? "positive" : "negative"} accent="blue" icon={<Wallet size={18} />} />
      </section>

      {period.isCurrent && (
        <>
          <div className="dashboard-section-heading section">
            <div><span className="eyebrow">PERSONNALISÉ POUR TOI</span><h2>Des actions utiles cette semaine</h2></div>
            <Link href={`/settings?month=${period.month}&year=${period.year}`}>Ajuster mon profil <ArrowRight size={14} /></Link>
          </div>
          <section className="grid grid-2 personalized-grid">
            <GroceryMarketCard
              market={groceryMarket}
              groceryBudgetWeekly={
                profile?.grocery_budget_weekly === null || profile?.grocery_budget_weekly === undefined
                  ? null
                  : Number(profile.grocery_budget_weekly)
              }
              monthlyGrocerySpent={monthlyGrocerySpent}
              dayOfMonth={snapshot.dayOfMonth}
            />
            <IncomeIdeasCard
              birthYear={profile?.birth_year || null}
              employmentStatus={profile?.employment_status || null}
              skills={profile?.skills || ""}
            />
          </section>
        </>
      )}

      <details className="dashboard-details section">
        <summary>
          <span><Gauge size={18} /><span><strong>Analyses détaillées</strong><small>Graphiques, simulateur, conseils et objectifs</small></span></span>
          <span className="details-action">Afficher</span>
        </summary>
        <div className="dashboard-details-content">
          <section className="grid grid-2 analysis-grid">
            <div className="card spending-card">
              <div className="card-title-row"><div><span className="eyebrow">Où part ton argent ?</span><h3>Répartition des dépenses</h3></div><span className="card-heading-icon"><Gauge aria-hidden="true" /></span></div>
              <SpendingDonut data={snapshot.categories} />
            </div>
            <SavingsSimulator categories={snapshot.categories} />
          </section>

          <section className="grid grid-2 smart-grid">
            <SmartCoach initialTips={buildLocalInsights(snapshot)} />

            <div className="card goals-card">
              <span className="eyebrow">Progression</span>
              <h3>Objectifs d’épargne</h3>
              <p className="muted">Tes principaux objectifs</p>
              {goals.length ? (
                <div className="grid goal-list">
                  {goals.map((goal) => {
                    const currentAmount = Number(goal.current_amount);
                    const targetAmount = Number(goal.target_amount);
                    const progress = targetAmount > 0 ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
                    return (
                      <div className="goal-line" key={goal.id}>
                        <div className="split-row"><strong>{goal.name}</strong><span className="goal-percent">{progress.toFixed(0)} %</span></div>
                        <div className="progress"><div style={{ width: `${progress}%` }} /></div>
                        <small>{euro(currentAmount)} économisés sur {euro(targetAmount)}</small>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-goal"><span>🎯</span><p>Ajoute ton premier objectif pour visualiser ta progression.</p><Link href="/goals" className="btn btn-compact">Créer un objectif</Link></div>
              )}
            </div>
          </section>

          <section className="card history-card">
            <div className="card-title-row"><div><span className="eyebrow">Tendance</span><h3>Évolution sur 6 mois</h3></div></div>
            <p className="muted">Revenus et dépenses enregistrés</p>
            <DashboardChart data={chartData} />
          </section>
        </div>
      </details>
    </div>
  );
}
