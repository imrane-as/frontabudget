import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { buildBudgetSnapshot, buildLocalInsights } from "@/lib/smart-budget";
import { createClient } from "@/lib/supabase/server";

type OpenAIResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

function extractTips(payload: OpenAIResponse) {
  const text =
    payload.output
      ?.flatMap((item) => item.content || [])
      .filter((content) => content.type === "output_text")
      .map((content) => content.text || "")
      .join("\n") || "";

  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length >= 10)
    .slice(0, 3);
}

export async function POST() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");

  const [transactionsResult, budgetsResult, profileResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount,type,category_id,categories(name)")
      .eq("user_id", user.id)
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    supabase
      .from("budgets")
      .select("id,planned_amount,category_id,categories(name)")
      .eq("user_id", user.id)
      .eq("month", now.getMonth() + 1)
      .eq("year", now.getFullYear()),
    supabase
      .from("profiles")
      .select("budget_alert_threshold")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  const snapshot = buildBudgetSnapshot({
    transactions: transactionsResult.data || [],
    budgets: budgetsResult.data || [],
    now,
    alertThreshold: Number(profileResult.data?.budget_alert_threshold) || 80
  });
  const localTips = buildLocalInsights(snapshot);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      tips: localTips,
      source: "local",
      notice: "Ajoute OPENAI_API_KEY pour activer l’analyse IA."
    });
  }

  const { data: quotaAllowed, error: quotaError } = await supabase.rpc(
    "consume_ai_quota",
    { p_user_id: user.id, p_daily_limit: 3 }
  );

  if (!quotaError && quotaAllowed === false) {
    return NextResponse.json(
      {
        error: "Limite de 3 analyses IA par jour atteinte.",
        tips: localTips,
        source: "local"
      },
      { status: 429 }
    );
  }

  const aggregate = {
    period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    dayOfMonth: snapshot.dayOfMonth,
    daysInMonth: snapshot.daysInMonth,
    income: Math.round(snapshot.income),
    expenses: Math.round(snapshot.expenses),
    remaining: Math.round(snapshot.remaining),
    projectedExpenses: Math.round(snapshot.projectedExpenses),
    savingRate: Math.round(snapshot.savingRate),
    topCategories: snapshot.categories.slice(0, 5),
    budgets: snapshot.budgets.slice(0, 8).map((budget) => ({
      category: budget.categoryName,
      planned: Math.round(budget.planned),
      spent: Math.round(budget.spent),
      percentage: Math.round(budget.percentage),
      projected: Math.round(budget.projected)
    }))
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
        reasoning: { effort: "none" },
        instructions:
          "Tu es le coach budget de FrontaBudget. Donne exactement 3 conseils en français, concrets, bienveillants et courts. Une seule ligne par conseil, sans titre. Base-toi uniquement sur les agrégats. Ne présente jamais ceci comme un conseil financier, fiscal ou d’investissement. Ne demande pas d’acheter un produit.",
        input: JSON.stringify(aggregate),
        max_output_tokens: 360,
        store: false
      })
    });

    if (!response.ok) {
      return NextResponse.json({ tips: localTips, source: "local" });
    }

    const payload = (await response.json()) as OpenAIResponse;
    const tips = extractTips(payload);

    return NextResponse.json({
      tips: tips.length === 3 ? tips : localTips,
      source: tips.length === 3 ? "ai" : "local"
    });
  } catch {
    return NextResponse.json({ tips: localTips, source: "local" });
  }
}
