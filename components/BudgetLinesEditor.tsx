"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteBudgetLine,
  updateBudgetLine,
  type BudgetLineActionResult
} from "@/app/(app)/budgets/actions";

type BudgetLine = {
  id: string;
  categoryName: string;
  plannedAmount: number;
};

type Props = {
  budgets: BudgetLine[];
  month: number;
  year: number;
};

export default function BudgetLinesEditor({ budgets, month, year }: Props) {
  const router = useRouter();
  const [amountById, setAmountById] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      budgets.map((budget) => [budget.id, String(budget.plannedAmount)])
    )
  );
  const [runningId, setRunningId] = useState<string | null>(null);
  const [result, setResult] = useState<BudgetLineActionResult | null>(null);

  async function handleUpdate(budgetId: string) {
    const value = Number(amountById[budgetId]);

    setRunningId(budgetId);
    setResult(null);

    let actionResult: BudgetLineActionResult;

    try {
      actionResult = await updateBudgetLine({ budgetId, amount: value });
    } catch {
      actionResult = {
        ok: false,
        message: "La connexion a échoué. Recharge la page puis réessaie."
      };
    }

    setResult(actionResult);
    setRunningId(null);

    if (!actionResult.ok) {
      return;
    }

    router.replace(`/budgets?month=${month}&year=${year}`);
    router.refresh();
  }

  async function handleDelete(budgetId: string, categoryName: string) {
    const confirmed = window.confirm(
      `Supprimer la ligne budget pour ${categoryName} ?`
    );

    if (!confirmed) {
      return;
    }

    setRunningId(budgetId);
    setResult(null);

    let actionResult: BudgetLineActionResult;

    try {
      actionResult = await deleteBudgetLine({ budgetId });
    } catch {
      actionResult = {
        ok: false,
        message: "La connexion a échoué. Recharge la page puis réessaie."
      };
    }

    setResult(actionResult);
    setRunningId(null);

    if (!actionResult.ok) {
      return;
    }

    router.replace(`/budgets?month=${month}&year=${year}`);
    router.refresh();
  }

  if (!budgets.length) {
    return null;
  }

  return (
    <div className="card" style={{ marginTop: 18 }}>
      <div className="card-title-row">
        <div>
          <span className="eyebrow">Gestion</span>
          <h3>Modifier ou supprimer une ligne</h3>
        </div>
      </div>

      <div className="grid" style={{ gap: 10 }}>
        {budgets.map((budget) => {
          const busy = runningId === budget.id;

          return (
            <div className="split-row" key={budget.id}>
              <strong>{budget.categoryName}</strong>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  justifyContent: "flex-end"
                }}
              >
                <input
                  type="number"
                  min="0"
                  max="1000000000"
                  step="0.01"
                  value={amountById[budget.id] || ""}
                  onChange={(event) =>
                    setAmountById((previous) => ({
                      ...previous,
                      [budget.id]: event.target.value
                    }))
                  }
                  style={{ width: 140 }}
                />
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => handleUpdate(budget.id)}
                >
                  {busy ? "..." : "Modifier"}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(budget.id, budget.categoryName)}
                >
                  {busy ? "..." : "Supprimer"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {result && (
        <div
          aria-live="polite"
          className={result.ok ? "success" : "error"}
          style={{ marginTop: 12 }}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
