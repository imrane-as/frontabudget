import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];

  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  )
    .toISOString()
    .split("T")[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .gte("transaction_date", firstDay)
    .lte("transaction_date", lastDay);

  const income =
    transactions
      ?.filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) ?? 0;

  const expenses =
    transactions
      ?.filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0) ?? 0;

  const remaining = income - expenses;

  const savingRate =
    income > 0
      ? ((remaining / income) * 100).toFixed(1)
      : "0";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">

      <div className="mx-auto max-w-7xl">

        <div className="mb-10">
          <p className="text-slate-400">
            Vue mensuelle
          </p>

          <h1 className="text-3xl font-bold">
            Mon dashboard
          </h1>
        </div>

        <div className="grid gap-5 md:grid-cols-4">

          <Card
            title="Revenus"
            value={`${income.toFixed(2)} €`}
          />

          <Card
            title="Dépenses"
            value={`${expenses.toFixed(2)} €`}
          />

          <Card
            title="Disponible"
            value={`${remaining.toFixed(2)} €`}
          />

          <Card
            title="Taux d'épargne"
            value={`${savingRate} %`}
          />

        </div>

      </div>

    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

    </div>
  );
}