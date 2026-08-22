"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string | null;
};

export default function TransactionForm() {
  const supabase = createClient();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id,name,type,icon")
      .order("name")
      .then(({ data }) => setCategories((data || []) as Category[]));
  }, [supabase]);

  const visibleCategories = categories.filter((category) => category.type === type);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      category_id: categoryId || null,
      name,
      amount: Number(amount),
      type,
      transaction_date: date
    });

    setLoading(false);

    if (!error) {
      setName("");
      setAmount("");
      setCategoryId("");
      router.refresh();
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Libellé
        <input
          required
          placeholder="Ex. Courses"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <div className="grid grid-2">
        <label>
          Type
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as "income" | "expense");
              setCategoryId("");
            }}
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
        </label>

        <label>
          Montant (€)
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-2">
        <label>
          Catégorie
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sans catégorie</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon || ""} {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Ajout..." : "Ajouter la transaction"}
      </button>
    </form>
  );
}
