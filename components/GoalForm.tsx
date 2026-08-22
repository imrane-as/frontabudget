"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function GoalForm() {
  const supabase = createClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [targetDate, setTargetDate] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("goals").insert({
      user_id: user.id,
      name,
      target_amount: Number(target),
      current_amount: Number(current || 0),
      target_date: targetDate || null
    });

    setName("");
    setTarget("");
    setCurrent("");
    setTargetDate("");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Objectif
        <input required placeholder="Ex. Voyage" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-2">
        <label>
          Montant cible (€)
          <input required type="number" min="0" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <label>
          Déjà épargné (€)
          <input type="number" min="0" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
      </div>
      <label>
        Date cible
        <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </label>
      <button className="btn btn-primary">Ajouter l’objectif</button>
    </form>
  );
}
