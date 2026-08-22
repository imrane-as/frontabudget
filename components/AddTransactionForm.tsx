"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AddTransactionForm() {

  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">(
    "expense"
  );

  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {

    e.preventDefault();

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        name,
        amount: Number(amount),
        type,
        transaction_date: new Date()
          .toISOString()
          .split("T")[0],
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setAmount("");

    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6"
    >

      <h2 className="text-xl font-semibold">
        Ajouter une transaction
      </h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex : Courses"
        required
        className="w-full rounded-xl bg-slate-800 p-3 outline-none"
      />

      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Montant"
        required
        className="w-full rounded-xl bg-slate-800 p-3 outline-none"
      />

      <select
        value={type}
        onChange={(e) =>
          setType(e.target.value as "income" | "expense")
        }
        className="w-full rounded-xl bg-slate-800 p-3"
      >
        <option value="expense">
          Dépense
        </option>

        <option value="income">
          Revenu
        </option>
      </select>

      <button
        disabled={loading}
        className="w-full rounded-xl bg-emerald-500 p-3 font-semibold text-slate-950"
      >
        {loading
          ? "Enregistrement..."
          : "Ajouter"}
      </button>

    </form>
  );
}