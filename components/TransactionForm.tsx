"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  saveTransaction,
  type SaveTransactionResult
} from "@/app/(app)/transactions/actions";
import MerchantMark from "@/components/MerchantMark";
import type {
  CategorizationSuggestion,
  TransactionType
} from "@/lib/transaction-categorizer";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
};

type Props = {
  categories: Category[];
};

type SuggestionResponse = CategorizationSuggestion & { notice?: string };

export default function TransactionForm({ categories }: Props) {
  const router = useRouter();
  const manualCategory = useRef(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [result, setResult] = useState<SaveTransactionResult | null>(null);

  const visibleCategories = categories.filter((category) => category.type === type);

  useEffect(() => {
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setCategorizing(true);

      try {
        const response = await fetch("/api/categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, type }),
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          setSuggestion(null);
          return;
        }

        const nextSuggestion = (await response.json()) as SuggestionResponse;
        setSuggestion(nextSuggestion);

        if (!manualCategory.current) {
          const matchedCategory = categories.find(
            (category) =>
              category.type === type &&
              category.name.localeCompare(nextSuggestion.categoryName, "fr", {
                sensitivity: "base"
              }) === 0
          );

          if (matchedCategory) {
            setCategoryId(matchedCategory.id);
          }
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setSuggestion(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCategorizing(false);
        }
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [categories, name, type]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    let saveResult: SaveTransactionResult;

    try {
      saveResult = await saveTransaction({
        name,
        amount: Number(amount),
        type,
        categoryId: categoryId || null,
        date
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

    setName("");
    setAmount("");
    setCategoryId("");
    setSuggestion(null);
    manualCategory.current = false;
    router.refresh();
  }

  return (
    <form className="form transaction-form" onSubmit={submit}>
      <label>
        Libellé
        <div className="smart-input-wrap">
          <input
            required
            maxLength={120}
            autoComplete="off"
            placeholder="Ex. Netflix, Sosh, crédit iPhone…"
            value={name}
            onChange={(event) => {
              manualCategory.current = false;
              setCategoryId("");
              setSuggestion(null);
              setCategorizing(false);
              setName(event.target.value);
            }}
          />
          <span className="smart-input-icon" aria-hidden="true">
            {categorizing ? <LoaderCircle className="spin" /> : <Sparkles />}
          </span>
        </div>
      </label>

      {suggestion && (
        <div className="category-suggestion" aria-live="polite">
          <MerchantMark name={suggestion.displayName} presentation={suggestion} />
          <div>
            <strong>{suggestion.displayName}</strong>
            <span>
              {suggestion.icon} {suggestion.categoryName}
              {suggestion.source === "fallback" && " · à confirmer"}
            </span>
          </div>
          <span className={`suggestion-source source-${suggestion.source}`}>
            {suggestion.source === "ai"
              ? "IA"
              : suggestion.source === "local"
                ? "Auto"
                : "Manuel"}
          </span>
        </div>
      )}

      <div className="grid grid-2">
        <label>
          Type
          <select
            value={type}
            onChange={(event) => {
              manualCategory.current = false;
              setType(event.target.value as TransactionType);
              setCategoryId("");
              setSuggestion(null);
              setCategorizing(false);
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
            min="0.01"
            max="1000000000"
            step="0.01"
            inputMode="decimal"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-2">
        <label>
          Catégorie
          <select
            value={categoryId}
            onChange={(event) => {
              manualCategory.current = true;
              setCategoryId(event.target.value);
            }}
          >
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
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>

      {suggestion?.notice && (
        <p className="microcopy" role="status">
          {suggestion.notice}
        </p>
      )}

      {result && (
        <div aria-live="polite" className={result.ok ? "success" : "error"}>
          {result.message}
        </div>
      )}

      <button className="btn btn-primary" disabled={loading}>
        {loading ? "Ajout..." : "Ajouter la transaction"}
      </button>

      <p className="transaction-privacy">
        Le classement local est prioritaire. Si l’IA est nécessaire, seul le libellé
        est envoyé — jamais le montant, la date ou votre budget.
      </p>
    </form>
  );
}
