import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";
import { resolveMonthPeriod } from "@/lib/month-period";
import { generateMonthlyReportPdf } from "@/lib/monthly-report-pdf";
import { buildBudgetSnapshot } from "@/lib/smart-budget";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CategoryRelation = { name?: string | null } | { name?: string | null }[] | null;

function categoryName(value: CategoryRelation) {
  const category = Array.isArray(value) ? value[0] : value;
  return category?.name || "Autre";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const period = resolveMonthPeriod(
    request.nextUrl.searchParams.get("month"),
    request.nextUrl.searchParams.get("year")
  );

  const [transactionsResult, budgetsResult, profileResult, logoJpeg] = await Promise.all([
    supabase
      .from("transactions")
      .select("name,amount,type,transaction_date,category_id,categories(name)")
      .eq("user_id", authData.user.id)
      .gte("transaction_date", period.start)
      .lte("transaction_date", period.end)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("budgets")
      .select("id,planned_amount,category_id,categories(name)")
      .eq("user_id", authData.user.id)
      .eq("month", period.month)
      .eq("year", period.year),
    supabase
      .from("profiles")
      .select("full_name,monthly_savings_target,budget_alert_threshold")
      .eq("id", authData.user.id)
      .maybeSingle(),
    readFile(join(process.cwd(), "public", "frontabudget-report-logo.jpg"))
  ]);

  if (transactionsResult.error || budgetsResult.error) {
    return NextResponse.json(
      { message: "Les données du rapport n’ont pas pu être chargées." },
      { status: 500 }
    );
  }

  const transactions = transactionsResult.data || [];
  const budgets = budgetsResult.data || [];
  const analysisDate = period.isCurrent ? new Date() : new Date(period.year, period.month, 0);
  const snapshot = buildBudgetSnapshot({
    transactions,
    budgets,
    now: analysisDate,
    alertThreshold: Number(profileResult.data?.budget_alert_threshold) || 80,
    monthlySavingsTarget: Number(profileResult.data?.monthly_savings_target) || 0
  });
  const salaryIncome = transactions
    .filter((transaction) => {
      if (transaction.type !== "income") return false;
      const searchable = `${transaction.name} ${categoryName(transaction.categories)}`.toLocaleLowerCase("fr");
      return searchable.includes("salaire") || searchable.includes("paie");
    })
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const ownerName = profileResult.data?.full_name?.trim()
    || authData.user.email?.split("@")[0]
    || "Utilisateur";
  const pdf = generateMonthlyReportPdf({
    periodLabel: period.label,
    generatedLabel: format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr }),
    ownerName,
    income: snapshot.income,
    salaryIncome,
    expenses: snapshot.expenses,
    savings: snapshot.remaining,
    savingRate: snapshot.savingRate,
    categories: snapshot.categories,
    budgets: snapshot.budgets.map((budget) => ({
      name: budget.categoryName,
      planned: budget.planned,
      spent: budget.spent
    })),
    transactions: transactions.map((transaction) => ({
      date: format(new Date(`${transaction.transaction_date}T12:00:00`), "dd/MM/yyyy"),
      name: transaction.name,
      category: categoryName(transaction.categories),
      type: transaction.type === "income" ? "income" : "expense",
      amount: Number(transaction.amount)
    })),
    logoJpeg
  });
  const filename = `frontabudget-rapport-${period.key}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "sandbox",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive"
    }
  });
}

