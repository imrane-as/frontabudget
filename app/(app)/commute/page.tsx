import CommuteForm from "@/components/CommuteForm";
import MetricCard from "@/components/MetricCard";
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
    <div>
      <div className="page-head">
        <p className="muted">France → Luxembourg</p>
        <h1>Coût de mobilité</h1>
      </div>

      <section className="grid grid-4">
        <MetricCard label="Distance mensuelle" value={`${km.toLocaleString("fr-FR")} km`} />
        <MetricCard label="Coût mobilité" value={euro(total)} tone="negative" />
        <MetricCard label="Jours sur site" value={`${days}`} />
        <MetricCard
          label="Coût / jour sur site"
          value={days > 0 ? euro(total / days) : euro(0)}
        />
      </section>

      <section className="card section" style={{ maxWidth: 760 }}>
        <h3>Mes paramètres de trajet</h3>
        <CommuteForm initial={profile} />
      </section>
    </div>
  );
}
