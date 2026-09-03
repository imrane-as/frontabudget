import { BadgeEuro, FileCheck2, FileKey2, ShieldCheck } from "lucide-react";
import MonthNavigator from "@/components/MonthNavigator";
import PageIntro from "@/components/PageIntro";
import PayslipActions from "@/components/PayslipActions";
import PayslipUploader from "@/components/PayslipUploader";
import { requireUser } from "@/lib/auth";
import { resolveMonthPeriod } from "@/lib/month-period";
import { euro } from "@/lib/money";
import { formatFileSize, formatPayslipPeriod } from "@/lib/payslip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PayslipRow = {
  id: string;
  period_year: number;
  period_month: number;
  employer_name: string | null;
  net_salary: number | string;
  original_filename: string;
  file_size: number;
  page_count: number;
  salary_transaction_id: string | null;
  created_at: string;
};

type PageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function PayslipsPage({ searchParams }: PageProps) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const period = resolveMonthPeriod(params.month, params.year);
  const { data, error } = await supabase
    .from("payslips")
    .select(
      "id,period_year,period_month,employer_name,net_salary,original_filename,file_size,page_count,salary_transaction_id,created_at"
    )
    .eq("user_id", user.id)
    .eq("period_year", period.year)
    .eq("period_month", period.month)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });
  const payslips = (data || []) as PayslipRow[];
  const latest = payslips[0];

  return (
    <div className="page-shell payslips-page">
      <PageIntro
        eyebrow="Documents personnels"
        title="Mes fiches de paie"
        tone="blue"
        icon={<FileKey2 size={27} />}
        aside={<span className="page-feature-pill"><ShieldCheck size={14} /> Coffre-fort privé</span>}
        description="Importe ton bulletin, récupère le salaire net et range chaque mois au même endroit."
      />

      <MonthNavigator
        basePath="/payslips"
        monthKey={period.key}
        periodLabel={period.label}
        previousKey={period.previousKey}
        nextKey={period.nextKey}
        isCurrent={period.isCurrent}
      />

      <section className="payslip-summary" aria-label="Résumé des fiches de paie">
        <article className="card payslip-summary-card">
          <span><FileCheck2 /></span>
          <div><small>Bulletins du mois</small><strong>{payslips.length}</strong></div>
        </article>
        <article className="card payslip-summary-card">
          <span><BadgeEuro /></span>
          <div><small>Salaire net du mois</small><strong>{latest ? euro(Number(latest.net_salary)) : "—"}</strong></div>
        </article>
        <article className="card payslip-summary-card payslip-summary-secure">
          <span><ShieldCheck /></span>
          <div><small>Protection</small><strong>Accès privé</strong></div>
        </article>
      </section>

      <section className="grid payslip-layout content-section">
        <article className="card payslip-import-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">NOUVEAU BULLETIN</span>
              <h3>Importer pour {period.label.toLocaleLowerCase("fr")}</h3>
            </div>
            <span className="card-heading-icon"><FileKey2 /></span>
          </div>
          <p className="payslip-card-copy">
            Les PDF normaux sont lus directement. Si un document est protégé, le mot de passe sera demandé à ce moment-là uniquement.
          </p>

          {error && (
            <div className="error payslip-migration-error">
              Le coffre-fort n’est pas encore disponible. Applique la migration <strong>0012_payslip_vault.sql</strong>, puis actualise cette page.
            </div>
          )}

          <PayslipUploader
            key={period.key}
            userId={user.id}
            initialPeriod={period.key}
            disabled={Boolean(error)}
          />
        </article>

        <article className="card payslip-library-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">ARCHIVES DU MOIS</span>
              <h3>{period.label}</h3>
            </div>
            <span className="payslip-count">{payslips.length}</span>
          </div>

          <div className="payslip-list">
            {payslips.map((payslip) => {
              const period = formatPayslipPeriod(payslip.period_year, payslip.period_month);

              return (
                <article className="payslip-item" key={payslip.id}>
                  <div className="payslip-file-mark"><FileCheck2 /></div>
                  <div className="payslip-item-copy">
                    <span>{payslip.employer_name || "Fiche de paie"}</span>
                    <strong>{period}</strong>
                    <small>
                      {payslip.page_count} page{payslip.page_count > 1 ? "s" : ""} · {formatFileSize(payslip.file_size)}
                      {payslip.salary_transaction_id ? " · Revenu ajouté" : ""}
                    </small>
                  </div>
                  <div className="payslip-item-salary">
                    <small>Net</small>
                    <strong>{euro(Number(payslip.net_salary))}</strong>
                  </div>
                  <PayslipActions id={payslip.id} period={period} />
                </article>
              );
            })}

            {!payslips.length && !error && (
              <div className="payslip-empty">
                <span><FileKey2 /></span>
                <strong>Ton coffre-fort est prêt</strong>
                <p>Aucune fiche n’est enregistrée pour {period.label.toLocaleLowerCase("fr")}.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
