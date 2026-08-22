import { Building2, Car, Gauge, MapPinned, Route } from "lucide-react";
import CommuteForm from "@/components/CommuteForm";
import MetricCard from "@/components/MetricCard";
import PageIntro from "@/components/PageIntro";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";

export default async function CommutePage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("commute_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const distance = Number(profile?.distance_one_way_km ?? 0);
  const days = Number(profile?.office_days_month ?? 0);
  const km = distance * 2 * days;

  const total =
    Number(profile?.fuel_cost_month ?? 0) +
    Number(profile?.parking_cost_month ?? 0) +
    Number(profile?.toll_cost_month ?? 0) +
    Number(profile?.leasing_cost_month ?? 0) +
    Number(profile?.insurance_cost_month ?? 0) +
    Number(profile?.other_cost_month ?? 0);

  return (
    <div className="page-shell commute-page">
      <PageIntro
        eyebrow="France → Luxembourg"
        title="Coût de mobilité"
        tone="blue"
        icon={<Car size={26} />}
        description="Visualise le vrai coût de tes trajets et repère les économies possibles."
        aside={<span className="page-feature-pill"><MapPinned size={14} /> {days} jours sur site</span>}
      />

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
        <p className="muted">Ajuste tes coûts pour obtenir une estimation mensuelle fidèle.</p>
        <CommuteForm initial={profile} />
      </section>
    </div>
  );
}
