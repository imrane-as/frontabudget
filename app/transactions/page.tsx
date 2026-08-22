import { createClient } from "@/lib/supabase/server";
import AddTransactionForm from "@/components/AddTransactionForm";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", {
      ascending: false,
    });

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">

      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">

        <AddTransactionForm />

        <div>

          <h1 className="mb-6 text-2xl font-bold">
            Transactions
          </h1>

          <div className="space-y-3">

            {transactions?.map((transaction: any) => (

              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4"
              >

                <div>

                  <p className="font-medium">
                    {transaction.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {transaction.transaction_date}
                  </p>

                </div>

                <p
                  className={
                    transaction.type === "income"
                      ? "font-semibold text-emerald-400"
                      : "font-semibold text-red-400"
                  }
                >
                  {transaction.type === "income"
                    ? "+"
                    : "-"}
                  {Number(transaction.amount).toFixed(2)} €
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}