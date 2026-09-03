"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function WorkDayForm({ initialDate }: { initialDate?: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [type, setType] = useState("luxembourg");

  async function submit(event: FormEvent) {
    event.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("work_days").upsert(
      {
        user_id: user.id,
        work_date: date,
        day_type: type
      },
      { onConflict: "user_id,work_date" }
    );

    router.refresh();
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <label>
        Type de journée
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="luxembourg">🏢 Luxembourg</option>
          <option value="remote">🏠 Télétravail</option>
          <option value="leave">🌴 Congé</option>
          <option value="sick">🤒 Maladie</option>
          <option value="other">Autre</option>
        </select>
      </label>

      <button className="btn btn-primary">Enregistrer la journée</button>
    </form>
  );
}
