import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Gauge,
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  Wallet
} from "lucide-react";
import BudgetAlerts from "@/components/BudgetAlerts";
import DashboardChart from "@/components/DashboardChart";
import FinancialHealthCard from "@/components/FinancialHealthCard";
import MetricCard from "@/components/MetricCard";
import SavingsSimulator from "@/components/SavingsSimulator";
import SmartCoach from "@/components/SmartCoach";
import SpendingDonut from "@/components/SpendingDonut";
import WeatherCard from "@/components/WeatherCard";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import { buildBudgetSnapshot, buildLocalInsights, calculateFinancialHealth } from "@/lib/smart-budget";
import { getWeather } from "@/lib/weather";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const historyStart = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,weather_city,budget_alert_threshold,monthly_savings_target")
    .eq("id", user.id)
    .maybeSingle();

  const alertThreshold = Number(profile?.budget_alert_threshold) || 80;
  const monthlySavingsTarget = Number(profile?.monthly_savings_target) || 300;
  const [transactionsResult, budgetsResult, goalsResult, weather] = await Promise.all([
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
      transaction.transaction_date >= monthStart && transaction.transaction_date <= monthEnd
  );
  const snapshot = buildBudgetSnapshot({
    transactions: currentTransactions,
    budgets: budgetsResult.data || [],
    now,
    alertThreshold,
    monthlySavingsTarget
  });
  const health = calculateFinancialHealth(snapshot);

  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const date = subMonths(now, i);
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
      <div className="dashboard-head">
        <div className="page-head">
          <span className="dashboard-date">{format(now, "EEEE d MMMM", { locale: fr })}</span>
          <h1>{firstName ? `Bonjour ${firstName}` : "Mon dashboard"}<span className="wave">👋</span></h1>
          <p className="muted">Ton argent devient plus simple, plus clair et plus motivant.</p>
        </div>
        <div className="month-progress-card">
          <div>
            <span>Progression du mois</span>
            <strong>{Math.round(monthProgress)} %</strong>
          </div>
          <div className="month-progress-track"><span style={{ width: `${monthProgress}%` }} /></div>
          <small>Jour {snapshot.dayOfMonth} sur {snapshot.daysInMonth}</small>
        </div>
      </div>

      <nav className="dashboard-quick-actions" aria-label="Actions rapides">
        <Link href="/transactions">
          <span className="quick-action-icon quick-action-mint"><Plus size={19} /></span>
          <span><strong>Ajouter</strong><small>Une opération</small></span>
          <ArrowRight size={16} />
        </Link>
        <Link href="/budgets">
          <span className="quick-action-icon quick-action-sun"><Wallet size={19} /></span>
          <span><strong>Planifier</strong><small>Un budget</small></span>
          <ArrowRight size={16} />
        </Link>
        <Link href="/goals">
          <span className="quick-action-icon quick-action-violet"><Target size={19} /></span>
          <span><strong>Créer</strong><small>Un objectif</small></span>
          <ArrowRight size={16} />
        </Link>
      </nav>

      <section className="finance-hero section">
        <span className="finance-hero-orb finance-hero-orb-one" aria-hidden="true" />
        <span className="finance-hero-orb finance-hero-orb-two" aria-hidden="true" />
        <div className="finance-hero-main">
          <span className="hero-kicker"><Sparkles size={15} /> Budget disponible</span>
          <p>Tu peux encore dépenser</p>
          <strong>{euro(snapshot.safeToSpend)}</strong>
          <span className="hero-explanation">après avoir protégé {euro(snapshot.monthlySavingsTarget)} d’épargne ✨</span>
          <div className="safe-spend-grid">
            <div><span>Par jour</span><strong>{euro(snapshot.safeToSpendDaily)}</strong><small>{snapshot.daysRemaining} jours restants</small></div>
            <div><span>Par semaine</span><strong>{euro(snapshot.safeToSpendWeekly)}</strong><small>rythme conseillé</small></div>
            <div><span>Projection du mois</span><strong>{euro(snapshot.projectedExpenses)}</strong><small>si le rythme continue</small></div>
          </div>
        </div>
        <FinancialHealthCard health={health} />
      </section>

      <BudgetAlerts budgets={snapshot.budgets} />

      <section className="grid grid-4 section metric-grid">
        <MetricCard label="Revenus" value={euro(snapshot.income)} detail="ce mois-ci" accent="emerald" icon={<ArrowUpRight size={18} />} />
        <MetricCard label="Dépenses" value={euro(snapshot.expenses)} detail={`${euro(snapshot.dailySpend)} / jour`} tone="negative" accent="rose" icon={<ArrowDownRight size={18} />} />
        <MetricCard label="Solde actuel" value={euro(snapshot.remaining)} detail="avant épargne protégée" tone={snapshot.remaining >= 0 ? "positive" : "negative"} accent="blue" icon={<Wallet size={18} />} />
        <MetricCard label="Taux d’épargne" value={`${snapshot.savingRate.toFixed(1)} %`} detail="sur les revenus saisis" accent="violet" icon={<PiggyBank size={18} />} />
      </section>

      <section className="grid grid-2 section analysis-grid">
        <div className="card spending-card">
          <div className="card-title-row"><div><span className="eyebrow">Où part ton argent ?</span><h3>Répartition des dépenses</h3></div><span className="card-heading-icon"><Gauge aria-hidden="true" /></span></div>
          <SpendingDonut data={snapshot.categories} />
        </div>
        <SavingsSimulator categories={snapshot.categories} />
      </section>

      <section className="grid grid-2 section smart-grid">
        <SmartCoach initialTips={buildLocalInsights(snapshot)} />
        <WeatherCard weather={weather} />
      </section>

      <section className="grid grid-2 section lower-grid">
        <div className="card history-card">
          <div className="card-title-row"><div><span className="eyebrow">Tendance</span><h3>Évolution sur 6 mois</h3></div></div>
          <p className="muted">Revenus et dépenses enregistrés</p>
          <DashboardChart data={chartData} />
        </div>

        <div className="card goals-card">
          <span className="eyebrow">Progression</span>
          <h3>Objectifs d’épargne</h3>
          <p className="muted">Vos principaux objectifs</p>
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
    </div>
  );
}
