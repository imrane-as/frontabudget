"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/app/(app)/transactions/actions";
import TransactionForm, {
  type EditableTransaction
} from "@/components/TransactionForm";
import { euro } from "@/lib/money";
import type { TransactionType } from "@/lib/transaction-categorizer";

type Category = {
  id: string;
  name: string;
  type: TransactionType;
  icon: string | null;
};

type Props = {
  transaction: EditableTransaction;
  categories: Category[];
};

type DialogMode = "edit" | "delete" | null;

export default function TransactionActions({ transaction, categories }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!dialog) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) setDialog(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [deleting, dialog]);

  function closeDialog() {
    if (deleting) return;
    setDialog(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteTransaction(transaction.id);

      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }

      setDialog(null);
      router.refresh();
    } catch {
      setDeleteError("La connexion a échoué. Recharge la page puis réessaie.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="transaction-row-actions">
        <button
          type="button"
          className="transaction-icon-button"
          aria-label={`Modifier ${transaction.name}`}
          title="Modifier"
          onClick={() => setDialog("edit")}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          className="transaction-icon-button transaction-icon-button-danger"
          aria-label={`Supprimer ${transaction.name}`}
          title="Supprimer"
          onClick={() => setDialog("delete")}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {dialog && (
        <div className="transaction-dialog-backdrop" onMouseDown={closeDialog}>
          <section
            className={`transaction-dialog transaction-dialog-${dialog}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`transaction-${dialog}-title`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="transaction-dialog-close"
              aria-label="Fermer"
              onClick={closeDialog}
              disabled={deleting}
            >
              <X size={18} />
            </button>

            {dialog === "edit" ? (
              <>
                <header className="transaction-dialog-header">
                  <span className="transaction-dialog-icon"><Pencil size={18} /></span>
                  <div>
                    <span className="eyebrow">MISE À JOUR</span>
                    <h2 id="transaction-edit-title">Modifier la transaction</h2>
                    <p>Corrige le libellé, le montant, la catégorie ou la date.</p>
                  </div>
                </header>
                <TransactionForm
                  key={transaction.id}
                  categories={categories}
                  initialTransaction={transaction}
                  onSaved={() => setDialog(null)}
                />
              </>
            ) : (
              <>
                <header className="transaction-dialog-header transaction-delete-header">
                  <span className="transaction-dialog-icon"><AlertTriangle size={20} /></span>
                  <div>
                    <span className="eyebrow">CONFIRMATION</span>
                    <h2 id="transaction-delete-title">Supprimer cette transaction ?</h2>
                    <p>Cette action actualisera immédiatement le dashboard et les budgets.</p>
                  </div>
                </header>

                <div className="transaction-delete-summary">
                  <span>{transaction.name}</span>
                  <strong>
                    {transaction.type === "income" ? "+" : "−"} {euro(transaction.amount)}
                  </strong>
                </div>

                {deleteError && <div className="error">{deleteError}</div>}

                <div className="transaction-dialog-actions">
                  <button type="button" className="btn" onClick={closeDialog} disabled={deleting}>
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    <Trash2 size={15} />
                    {deleting ? "Suppression..." : "Supprimer définitivement"}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
