"use client";

import { FormEvent, useRef, useState } from "react";
import {
  BadgeCheck,
  FileCheck2,
  FileKey2,
  LoaderCircle,
  LockKeyhole,
  UploadCloud
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_PAYSLIP_SIZE, formatFileSize } from "@/lib/payslip";
import {
  type ProcessedPayslip,
  unlockAndAnalyzePayslip
} from "@/lib/payslip-client";

type Result = { ok: boolean; message: string } | null;

export default function PayslipUploader({
  userId,
  disabled = false
}: {
  userId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const now = new Date();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [employer, setEmployer] = useState("");
  const [period, setPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [salary, setSalary] = useState("");
  const [createTransaction, setCreateTransaction] = useState(true);
  const [processed, setProcessed] = useState<ProcessedPayslip | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result>(null);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    setProcessed(null);
    setSalary("");
    setResult(null);
  }

  async function analyze() {
    if (!file) {
      setResult({ ok: false, message: "Choisis d’abord ta fiche de paie au format PDF." });
      return;
    }

    if (file.size > MAX_PAYSLIP_SIZE) {
      setResult({ ok: false, message: "Le PDF dépasse la limite de 12 Mo." });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const analysis = await unlockAndAnalyzePayslip(file, password);
      setProcessed(analysis);

      if (analysis.salary) setSalary(String(analysis.salary));
      if (analysis.period) {
        setPeriod(
          `${analysis.period.year}-${String(analysis.period.month).padStart(2, "0")}`
        );
      }

      setResult({
        ok: true,
        message: analysis.salary
          ? "PDF déverrouillé et salaire net détecté. Vérifie les informations avant l’ajout."
          : "PDF déverrouillé. Le salaire n’a pas été reconnu : indique-le avant l’ajout."
      });
    } catch (error) {
      setProcessed(null);
      setResult({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Le PDF n’a pas pu être déverrouillé."
      });
    } finally {
      setPassword("");
      setProcessing(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();

    if (!file || !processed) {
      setResult({ ok: false, message: "Déverrouille et analyse d’abord le PDF." });
      return;
    }

    const netSalary = Number(salary.replace(",", "."));
    const [year, month] = period.split("-").map(Number);

    if (!Number.isFinite(netSalary) || netSalary <= 0 || !year || !month) {
      setResult({ ok: false, message: "Vérifie le salaire net et le mois du bulletin." });
      return;
    }

    setSaving(true);
    setResult(null);

    const supabase = createClient();
    const id = crypto.randomUUID();
    const filePath = `${userId}/${id}.pdf`;
    const originalFilename = file.name
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 180) || "fiche-de-paie.pdf";

    const { error: uploadError } = await supabase.storage
      .from("payslips")
      .upload(filePath, processed.blob, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      setSaving(false);
      setResult({
        ok: false,
        message: /bucket|not found|row-level security/i.test(uploadError.message)
          ? "Le coffre-fort n’est pas prêt. Applique la migration 0012 puis réessaie."
          : "Le PDF n’a pas pu être envoyé dans ton coffre-fort."
      });
      return;
    }

    const { error: saveError } = await supabase.rpc("save_payslip_with_salary", {
      p_id: id,
      p_period_year: year,
      p_period_month: month,
      p_employer_name: employer.trim() || null,
      p_net_salary: netSalary,
      p_original_filename: originalFilename,
      p_file_size: processed.blob.size,
      p_page_count: processed.pageCount,
      p_create_transaction: createTransaction
    });

    if (saveError) {
      await supabase.storage.from("payslips").remove([filePath]);
      setSaving(false);
      setResult({
        ok: false,
        message:
          saveError.code === "23505"
            ? "Une fiche existe déjà pour ce mois. Supprime-la avant de la remplacer."
            : /PGRST202|schema cache|save_payslip|payslips/i.test(
                  `${saveError.code} ${saveError.message}`
                )
              ? "Supabase n’a pas encore chargé le coffre-fort. Applique la migration 0012 puis actualise."
              : "La fiche n’a pas pu être enregistrée. Réessaie dans un instant."
      });
      return;
    }

    setSaving(false);
    setFile(null);
    setProcessed(null);
    setSalary("");
    setEmployer("");
    if (fileInput.current) fileInput.current.value = "";
    setResult({
      ok: true,
      message: createTransaction
        ? "Fiche rangée et salaire ajouté automatiquement aux revenus."
        : "Fiche rangée dans ton coffre-fort."
    });
    router.refresh();
  }

  return (
    <form className="payslip-upload-form" onSubmit={save}>
      <div className="payslip-flow" aria-label="Étapes d’import">
        <span className={file ? "done" : "active"}><UploadCloud /> 1. PDF</span>
        <span className={processed ? "done" : file ? "active" : ""}><FileKey2 /> 2. Ouverture</span>
        <span className={processed ? "active" : ""}><BadgeCheck /> 3. Validation</span>
      </div>

      <label className={`payslip-dropzone ${file ? "has-file" : ""}`}>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled || processing || saving}
          onChange={(event) => selectFile(event.target.files?.[0] || null)}
        />
        <span className="payslip-dropzone-icon" aria-hidden="true">
          {file ? <FileCheck2 /> : <UploadCloud />}
        </span>
        <span>
          <strong>{file ? file.name : "Choisir une fiche de paie"}</strong>
          <small>{file ? formatFileSize(file.size) : "PDF uniquement · 12 Mo maximum"}</small>
        </span>
      </label>

      <div className="payslip-unlock-row">
        <label>
          Mot de passe du PDF
          <span className="payslip-password-field">
            <LockKeyhole aria-hidden="true" />
            <input
              type="password"
              autoComplete="off"
              placeholder="Laisser vide si le PDF est déjà ouvert"
              value={password}
              disabled={!file || processing || saving}
              onChange={(event) => setPassword(event.target.value)}
            />
          </span>
        </label>
        <button
          type="button"
          className="btn payslip-unlock-button"
          onClick={analyze}
          disabled={!file || disabled || processing || saving}
        >
          {processing ? <><LoaderCircle className="spin" /> Ouverture…</> : <><FileKey2 /> Déverrouiller et lire</>}
        </button>
      </div>

      <p className="payslip-security-note">
        <LockKeyhole /> Le mot de passe reste dans ce navigateur et est effacé juste après l’ouverture.
      </p>

      {processed && (
        <div className="payslip-review">
          <div className="payslip-review-head">
            <div>
              <span className="eyebrow">INFORMATIONS DÉTECTÉES</span>
              <h4>Confirmer avant de ranger</h4>
            </div>
            <span>{processed.pageCount} page{processed.pageCount > 1 ? "s" : ""}</span>
          </div>

          <div className="grid grid-2 payslip-fields">
            <label>
              Mois du salaire
              <input
                required
                type="month"
                min="2000-01"
                max="2100-12"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              />
            </label>
            <label>
              Salaire net (€)
              <input
                required
                type="text"
                inputMode="decimal"
                placeholder="Ex. 2450,30"
                value={salary}
                onChange={(event) => setSalary(event.target.value)}
              />
            </label>
          </div>

          <label>
            Employeur <span className="optional-label">facultatif</span>
            <input
              maxLength={120}
              placeholder="Ex. Mon entreprise"
              value={employer}
              onChange={(event) => setEmployer(event.target.value)}
            />
          </label>

          <label className="payslip-income-option">
            <input
              type="checkbox"
              checked={createTransaction}
              onChange={(event) => setCreateTransaction(event.target.checked)}
            />
            <span>
              <strong>Ajouter automatiquement ce salaire à mes revenus</strong>
              <small>Une seule transaction sera créée pour le mois sélectionné.</small>
            </span>
          </label>
        </div>
      )}

      {result && (
        <div className={result.ok ? "success" : "error"} role="status" aria-live="polite">
          {result.message}
        </div>
      )}

      {processed && (
        <button className="btn btn-primary payslip-save" disabled={saving || disabled}>
          {saving ? <><LoaderCircle className="spin" /> Enregistrement…</> : <><UploadCloud /> Ranger dans mon coffre-fort</>}
        </button>
      )}
    </form>
  );
}

