import { Building2, Car, Gauge, MapPinned, Route } from "lucide-react";
import CommuteForm from "@/components/CommuteForm";
import MetricCard from "@/components/MetricCard";
import MonthNavigator from "@/components/MonthNavigator";
import PageIntro from "@/components/PageIntro";
import { requireUser } from "@/lib/auth";
import { resolveMonthPeriod } from "@/lib/month-period";
import { euro } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function CommutePage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const period = resolveMonthPeriod(params.month, params.year);

  const [profileResult, workDaysResult] = await Promise.all([
    supabase
      .from("commute_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("work_days")
      .select("day_type")
      .eq("user_id", user.id)
      .gte("work_date", period.start)
      .lte("work_date", period.end)
  ]);
  const profile = profileResult.data;
  const workDays = workDaysResult.data || [];

  const distance = Number(profile?.distance_one_way_km ?? 0);
  const referenceDays = Number(profile?.office_days_month ?? 0);
  const days = workDays.length
    ? workDays.filter((day) => day.day_type === "luxembourg").length
    : referenceDays;
  const km = distance * 2 * days;
  const variableCosts =
    Number(profile?.fuel_cost_month ?? 0) +
    Number(profile?.parking_cost_month ?? 0) +
    Number(profile?.toll_cost_month ?? 0) +
    Number(profile?.other_cost_month ?? 0);
  const fixedCosts =
    Number(profile?.leasing_cost_month ?? 0) +
    Number(profile?.insurance_cost_month ?? 0);
  const activityRatio = workDays.length && referenceDays > 0 ? days / referenceDays : 1;
  const total = fixedCosts + variableCosts * activityRatio;

  return (
    <div className="page-shell commute-page">
      <PageIntro
        eyebrow="France → Luxembourg"
        title="Coût de mobilité"
        tone="blue"
        icon={<Car size={26} />}
        description="Visualise le vrai coût de tes trajets et repère les économies possibles."
        aside={<span className="page-feature-pill"><MapPinned size={14} /> {period.label}</span>}
      />

      <MonthNavigator
        basePath="/commute"
        monthKey={period.key}
        periodLabel={period.label}
        previousKey={period.previousKey}
        nextKey={period.nextKey}
        isCurrent={period.isCurrent}
      />

      {(profileResult.error || workDaysResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger tous les trajets de cette période.
        </div>
      )}

      <section className="grid grid-4 content-section metric-grid">
        <MetricCard label="Distance mensuelle" value={`${km.toLocaleString("fr-FR")} km`} accent="blue" icon={<Route size={18} />} />
        <MetricCard label="Coût mobilité" value={euro(total)} tone="negative" accent="rose" icon={<Car size={18} />} />
        <MetricCard label="Jours sur site" value={`${days}`} accent="violet" icon={<Building2 size={18} />} />
        <MetricCard
          label="Coût / jour sur site"
          value={days > 0 ? euro(total / days) : euro(0)}
          icon={<Gauge size={18} />}
        />
      </section>

      <section className="card section form-feature-card commute-form-card">
        <span className="eyebrow">Simulateur personnel</span>
        <h3>Mes paramètres de trajet</h3>
        <p className="muted">Ces paramètres servent de référence. Les jours saisis dans Télétravail adaptent automatiquement chaque mois.</p>
        <CommuteForm initial={profile} />
      </section>
    </div>
  );
}
