"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveBudget,
  type SaveBudgetResult
} from "@/app/(app)/budgets/actions";

type Props = {
  categories: { id: string; name: string }[];
  initialMonth: number;
  initialYear: number;
};

export default function BudgetForm({
  categories,
  initialMonth,
  initialYear
}: Props) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SaveBudgetResult | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    let saveResult: SaveBudgetResult;

    try {
      saveResult = await saveBudget({
        categoryId,
        amount: Number(amount),
        month,
        year
      });
    } catch {
      saveResult = {
        ok: false,
        message: "La connexion a échoué. Recharge la page puis réessaie."
      };
    }

    setResult(saveResult);
    setLoading(false);

    if (!saveResult.ok) {
      return;
    }

    setAmount("");
    router.replace(`/budgets?month=${month}&year=${year}`);
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
          max="1000000000"
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
            max="2100"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </label>
      </div>

      {result && (
        <div
          aria-live="polite"
          className={result.ok ? "success" : "error"}
        >
          {result.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={loading || !categories.length}>
        {loading ? "Enregistrement..." : "Enregistrer le budget"}
      </button>
    </form>
  );
}
