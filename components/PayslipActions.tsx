"use client";

import { useState } from "react";
import { Download, Eye, LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deletePayslip,
  type DeletePayslipResult
} from "@/app/(app)/payslips/actions";

export default function PayslipActions({ id, period }: { id: string; period: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<DeletePayslipResult | null>(null);

  async function remove() {
    setDeleting(true);
    setResult(null);

    try {
      const nextResult = await deletePayslip(id);
      setResult(nextResult);
      if (nextResult.ok) {
        setConfirming(false);
        router.refresh();
      }
    } catch {
      setResult({ ok: false, message: "La connexion a échoué. Réessaie." });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="payslip-actions">
        <a
          className="btn btn-compact"
          href={`/api/payslips/${id}/file`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Eye /> Voir
        </a>
        <a
          className="payslip-icon-button"
          href={`/api/payslips/${id}/file?download=1`}
          aria-label={`Télécharger la fiche de ${period}`}
        >
          <Download />
        </a>
        <button
          type="button"
          className="payslip-icon-button payslip-delete-trigger"
          aria-label={`Supprimer la fiche de ${period}`}
          onClick={() => {
            setResult(null);
            setConfirming(true);
          }}
        >
          <Trash2 />
        </button>
      </div>

      {confirming && (
        <div className="transaction-dialog-backdrop" onMouseDown={() => !deleting && setConfirming(false)}>
          <section
            className="transaction-dialog transaction-dialog-delete payslip-delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payslip-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="transaction-dialog-close"
              aria-label="Fermer"
              disabled={deleting}
              onClick={() => setConfirming(false)}
            >
              <X />
            </button>
            <header className="transaction-dialog-header transaction-delete-header">
              <span className="transaction-dialog-icon"><Trash2 /></span>
              <div>
                <span className="eyebrow">SUPPRESSION</span>
                <h3 id="payslip-delete-title">Supprimer {period} ?</h3>
              </div>
            </header>
            <p>
              Le PDF privé et la transaction de salaire créée avec cette fiche seront supprimés.
            </p>
            {result && !result.ok && <div className="error" role="alert">{result.message}</div>}
            <div className="transaction-dialog-actions">
              <button type="button" className="btn" disabled={deleting} onClick={() => setConfirming(false)}>
                Annuler
              </button>
              <button type="button" className="btn btn-danger" disabled={deleting} onClick={remove}>
                {deleting ? <><LoaderCircle className="spin" /> Suppression…</> : <><Trash2 /> Supprimer</>}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

