"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Commute = {
  distance_one_way_km: number | string | null;
  office_days_month: number | null;
  fuel_cost_month: number | string | null;
  parking_cost_month: number | string | null;
  toll_cost_month: number | string | null;
  leasing_cost_month: number | string | null;
  insurance_cost_month: number | string | null;
  other_cost_month: number | string | null;
};

export default function CommuteForm({ initial }: { initial?: Commute | null }) {
  const supabase = createClient();
  const router = useRouter();

  const [distance, setDistance] = useState(String(initial?.distance_one_way_km ?? 55));
  const [days, setDays] = useState(String(initial?.office_days_month ?? 18));
  const [fuel, setFuel] = useState(String(initial?.fuel_cost_month ?? 0));
  const [parking, setParking] = useState(String(initial?.parking_cost_month ?? 0));
  const [tolls, setTolls] = useState(String(initial?.toll_cost_month ?? 0));
  const [leasing, setLeasing] = useState(String(initial?.leasing_cost_month ?? 0));
  const [insurance, setInsurance] = useState(String(initial?.insurance_cost_month ?? 0));
  const [other, setOther] = useState(String(initial?.other_cost_month ?? 0));

  async function submit(event: FormEvent) {
    event.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("commute_profiles").upsert(
      {
        user_id: user.id,
        distance_one_way_km: Number(distance),
        office_days_month: Number(days),
        fuel_cost_month: Number(fuel),
        parking_cost_month: Number(parking),
        toll_cost_month: Number(tolls),
        leasing_cost_month: Number(leasing),
        insurance_cost_month: Number(insurance),
        other_cost_month: Number(other),
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );

    router.refresh();
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="grid grid-2">
        <label>
          Distance aller simple (km)
          <input type="number" min="0" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} />
        </label>
        <label>
          Jours sur site / mois
          <input type="number" min="0" max="31" value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-2">
        <label>
          Carburant / mois
          <input type="number" min="0" step="0.01" value={fuel} onChange={(e) => setFuel(e.target.value)} />
        </label>
        <label>
          Parking / mois
          <input type="number" min="0" step="0.01" value={parking} onChange={(e) => setParking(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-2">
        <label>
          Leasing / mois
          <input type="number" min="0" step="0.01" value={leasing} onChange={(e) => setLeasing(e.target.value)} />
        </label>
        <label>
          Assurance / mois
          <input type="number" min="0" step="0.01" value={insurance} onChange={(e) => setInsurance(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-2">
        <label>
          Péages
          <input type="number" min="0" step="0.01" value={tolls} onChange={(e) => setTolls(e.target.value)} />
        </label>
        <label>
          Autres frais
          <input type="number" min="0" step="0.01" value={other} onChange={(e) => setOther(e.target.value)} />
        </label>
      </div>

      <button className="btn btn-primary">Enregistrer</button>
    </form>
  );
}
