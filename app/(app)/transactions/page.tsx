import { requireUser } from "@/lib/auth";
import { euro } from "@/lib/money";
import TransactionForm from "@/components/TransactionForm";

export default async function TransactionsPage() {
  const { supabase, user } = await requireUser();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id,name,amount,type,transaction_date,categories(name,icon)")
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="page-head">
        <p className="muted">Revenus et dépenses</p>
        <h1>Transactions</h1>
      </div>

      <section className="grid grid-2">
        <div className="card">
          <h3>Ajouter une transaction</h3>
          <TransactionForm />
        </div>

        <div className="card">
          <h3>Historique récent</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.map((row) => (
                  <tr key={row.id}>
                    <td>{row.transaction_date}</td>
                    <td>{row.name}</td>
                    <td
                      className={
                        row.type === "income" ? "amount-income" : "amount-expense"
                      }
                    >
                      {row.type === "income" ? "+" : "-"} {euro(Number(row.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
