"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BudgetForm() {
  const supabase = createClient();
  const router = useRouter();

  const now = new Date();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name")
      .eq("type", "expense")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, [supabase]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        month,
        year,
        planned_amount: Number(amount)
      },
      { onConflict: "user_id,category_id,month,year" }
    );

    setAmount("");
    router.refresh();
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Catégorie
        <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Choisir</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label>
        Budget (€)
        <input
          required
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <div className="grid grid-2">
        <label>
          Mois
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </label>
        <label>
          Année
          <input
            type="number"
            min="2020"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
      </div>

      <button className="btn btn-primary">Enregistrer le budget</button>
    </form>
  );
}
