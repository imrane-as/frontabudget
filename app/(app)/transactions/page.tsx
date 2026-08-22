import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import TransactionForm from "@/components/TransactionForm";
import MerchantMark from "@/components/MerchantMark";
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

export default async function TransactionsPage() {
  const { supabase, user } = await requireUser();

  const [transactionsResult, categoriesResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("id,name,amount,type,transaction_date,categories(name,icon)")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(100),
    supabase
      .from("categories")
      .select("id,name,type,icon")
      .eq("user_id", user.id)
      .order("name")
  ]);

  const transactions = transactionsResult.data || [];

  return (
    <div>
      <div className="page-head">
        <p className="muted">Revenus, dépenses et classement intelligent</p>
        <h1>Transactions</h1>
        <p className="muted transaction-intro">
          Saisis un commerçant : la catégorie et son identité visuelle apparaissent
          automatiquement.
        </p>
      </div>

      {(transactionsResult.error || categoriesResult.error) && (
        <div className="error" style={{ marginBottom: 18 }}>
          Impossible de charger toutes les transactions. Recharge la page ou
          reconnecte-toi.
        </div>
      )}

      <section className="grid transaction-grid">
        <div className="card transaction-entry-card">
          <div className="card-title-row">
            <div>
              <span className="eyebrow">NOUVELLE OPÉRATION</span>
              <h3>Ajouter une transaction</h3>
            </div>
            <span className="ai-pill">✦ Classement intelligent</span>
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
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((row) => {
                  const relation = Array.isArray(row.categories)
                    ? row.categories[0]
                    : row.categories;
                  const categoryName = relation?.name || "Autre";
                  const merchant = getMerchantPresentation(
                    row.name,
                    categoryName
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
                        className={
                          row.type === "income" ? "amount-income" : "amount-expense"
                        }
                      >
                        {row.type === "income" ? "+" : "-"} {euro(Number(row.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!transactions.length && !transactionsResult.error && (
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
