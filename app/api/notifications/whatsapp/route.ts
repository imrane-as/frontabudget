import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";
import { buildBudgetSnapshot, buildLocalInsights } from "@/lib/smart-budget";
import { createClient } from "@/lib/supabase/server";
import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/whatsapp";

export async function POST() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp Cloud API n’est pas encore configurée sur le serveur." },
      { status: 503 }
    );
  }

  const now = new Date();
  const start = format(startOfMonth(now), "yyyy-MM-dd");
  const end = format(endOfMonth(now), "yyyy-MM-dd");
  const [profileResult, transactionsResult, budgetsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("whatsapp_phone,whatsapp_enabled,budget_alert_threshold")
      .eq("id", user.id)
      .maybeSingle(),
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
      .eq("year", now.getFullYear())
  ]);

  const profile = profileResult.data;
  if (!profile?.whatsapp_enabled || !profile.whatsapp_phone) {
    return NextResponse.json(
      { error: "Active WhatsApp et enregistre ton numéro avant le test." },
      { status: 400 }
    );
  }

  const snapshot = buildBudgetSnapshot({
    transactions: transactionsResult.data || [],
    budgets: budgetsResult.data || [],
    now,
    alertThreshold: Number(profile.budget_alert_threshold) || 80
  });
  const tip = buildLocalInsights(snapshot)[0] || "Continue à suivre tes dépenses.";

  try {
    await sendWhatsAppTemplate({
      to: profile.whatsapp_phone,
      template:
        process.env.WHATSAPP_TEMPLATE_WEEKLY_SUMMARY ||
        "frontabudget_weekly_summary",
      parameters: [
        Math.round(snapshot.expenses),
        Math.round(snapshot.income),
        Math.round(snapshot.remaining),
        tip
      ]
    });

    return NextResponse.json({ message: "Résumé envoyé sur WhatsApp." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Envoi WhatsApp impossible." },
      { status: 502 }
    );
  }
}
