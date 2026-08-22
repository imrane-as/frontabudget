"use client";

import { useState } from "react";

export default function CommutePage() {

  const [distance, setDistance] = useState(55);
  const [days, setDays] = useState(20);

  const [fuel, setFuel] = useState(240);
  const [parking, setParking] = useState(80);
  const [leasing, setLeasing] = useState(390);
  const [tolls, setTolls] = useState(0);

  const monthlyKm =
    distance * 2 * days;

  const mobilityCost =
    fuel +
    parking +
    leasing +
    tolls;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">

      <div className="mx-auto max-w-4xl">

        <h1 className="mb-8 text-3xl font-bold">
          Coût de mes trajets 🇫🇷 → 🇱🇺
        </h1>

        <div className="grid gap-6 md:grid-cols-2">

          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <Field
              label="Distance aller simple (km)"
              value={distance}
              setValue={setDistance}
            />

            <Field
              label="Jours au bureau / mois"
              value={days}
              setValue={setDays}
            />

            <Field
              label="Carburant / mois"
              value={fuel}
              setValue={setFuel}
            />

            <Field
              label="Parking / mois"
              value={parking}
              setValue={setParking}
            />

            <Field
              label="Leasing / mois"
              value={leasing}
              setValue={setLeasing}
            />

            <Field
              label="Péages"
              value={tolls}
              setValue={setTolls}
            />

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-slate-400">
              Distance mensuelle
            </p>

            <p className="mt-2 text-4xl font-bold">
              {monthlyKm.toLocaleString()} km
            </p>

            <div className="my-8 border-t border-slate-800" />

            <p className="text-slate-400">
              Coût mensuel de mobilité
            </p>

            <p className="mt-2 text-4xl font-bold text-emerald-400">
              {mobilityCost.toFixed(2)} €
            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

function Field({
  label,
  value,
  setValue,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
}) {

  return (
    <label className="block">

      <span className="mb-2 block text-sm text-slate-400">
        {label}
      </span>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          setValue(Number(e.target.value))
        }
        className="w-full rounded-xl bg-slate-800 p-3"
      />

    </label>
  );
}