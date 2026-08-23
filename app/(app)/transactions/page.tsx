import { ArrowLeftRight, BadgeCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import TransactionActions from "@/components/TransactionActions";
import TransactionForm from "@/components/TransactionForm";
import MerchantMark from "@/components/MerchantMark";
import PageIntro from "@/components/PageIntro";
import { getMerchantPresentation } from "@/lib/transaction-categorizer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

type TransactionRow = {
  id: string;
  name: string;
  amount: number | string;
  type: "income" | "expense";
  transaction_date: string;
  category_id: string | null;
  merchant_name: string | null;
  merchant_domain: string | null;
  categorization_source: "local" | "ai" | "fallback" | null;
  categorization_url: string | null;
  categories:
    | { name: string; icon: string | null }
    | Array<{ name: string; icon: string | null }>
    | null;
};

export default async function TransactionsPage() {
  const { supabase, user } = await requireUser();

  const [richTransactionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id,name,amount,type,transaction_date,category_id,merchant_name,merchant_domain,categorization_source,categorization_url,categories(name,icon)"
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100),
    supabase
      .from("categories")
      .select("id,name,type,icon")
      .eq("user_id", user.id)
      .order("name")
  ]);

  let transactions = (richTransactionsResult.data || []) as unknown as TransactionRow[];
  let transactionsError = richTransactionsResult.error;

  if (richTransactionsResult.error) {
    const fallbackResult = await supabase
      .from("transactions")
      .select("id,name,amount,type,transaction_date,category_id,categories(name,icon)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100);

    transactions = (fallbackResult.data || []).map((row) => ({
      ...row,
      merchant_name: null,
      merchant_domain: null,
      categorization_source: null,
      categorization_url: null
    })) as unknown as TransactionRow[];
    transactionsError = fallbackResult.error;
  }

  return (
    <div className="page-shell transactions-page">
      <PageIntro
        eyebrow="Revenus et dépenses"
        title="Transactions"
        tone="violet"
        icon={<ArrowLeftRight size={26} />}
        aside={<span className="page-feature-pill"><BadgeCheck size={14} /> Logos automatiques</span>}
        description={
          <span className="transaction-intro">
            Saisis un commerçant : la catégorie et son identité visuelle apparaissent
            automatiquement.
          </span>
        }
      />

      {(transactionsError || categoriesResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger toutes les transactions. Recharge la page ou
          reconnecte-toi.
        </div>
      )}

      <section className="grid transaction-grid content-section">
        <div className="card transaction-entry-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">NOUVELLE OPÉRATION</span>
              <h3>Ajouter une transaction</h3>
            </div>
            <span className="automation-pill">✦ Classement automatique</span>
          </div>
          <TransactionForm categories={categoriesResult.data || []} />
        </div>

        <div className="card transaction-history-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">100 DERNIÈRES</span>
              <h3>Historique récent</h3>
            </div>
          </div>
          <div className="table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Commerçant</th>
                  <th className="transaction-amount">Montant</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => {
                  const relation = Array.isArray(row.categories)
                    ? row.categories[0]
                    : row.categories;
                  const categoryName = relation?.name || "Autre";
                  const merchant = getMerchantPresentation(
                    row.merchant_name || row.name,
                    categoryName,
                    row.merchant_domain
                  );

                  return (
                    <tr key={row.id}>
                      <td className="transaction-date">
                        {formatTransactionDate(row.transaction_date)}
                      </td>
                      <td>
                        <div className="merchant-cell" title={row.name}>
                          <MerchantMark
                            name={row.name}
                            categoryName={categoryName}
                            presentation={merchant}
                          />
                          <div>
                            <strong>{merchant.displayName}</strong>
                            <span>
                              {relation?.icon || "📦"} {categoryName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`transaction-amount ${
                          row.type === "income" ? "amount-income" : "amount-expense"
                        }`}
                      >
                        {row.type === "income" ? "+" : "-"} {euro(Number(row.amount))}
                      </td>
                      <td className="transaction-actions-cell">
                        <TransactionActions
                          categories={categoriesResult.data || []}
                          transaction={{
                            id: row.id,
                            name: row.name,
                            amount: Number(row.amount),
                            type: row.type,
                            categoryId: row.category_id,
                            date: row.transaction_date,
                            merchantName: row.merchant_name,
                            merchantDomain: row.merchant_domain,
                            categorizationSource: row.categorization_source,
                            categorizationUrl: row.categorization_url
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!transactions.length && !transactionsError && (
              <div className="empty-transactions">
                <span aria-hidden="true">✦</span>
                <strong>Ton historique est prêt</strong>
                <p>Ajoute Netflix, Sosh ou une autre dépense pour commencer.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
