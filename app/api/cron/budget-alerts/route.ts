import { endOfMonth, format, getISOWeek, getISOWeekYear, startOfMonth } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { buildBudgetSnapshot, buildLocalInsights } from "@/lib/smart-budget";
import { createAdminClient } from "@/lib/supabase/admin";
import { isWhatsAppConfigured, sendWhatsAppTemplate } from "@/lib/whatsapp";

type EnabledProfile = {
  id: string;
  whatsapp_phone: string | null;
  whatsapp_enabled: boolean;
  weekly_summary_enabled: boolean;
  budget_alert_threshold: number;
};

function isMondayInFrance(date: Date) {
  return (
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Paris",
      weekday: "short"
    }).format(date) === "Mon"
  );
}

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: "WhatsApp Cloud API n’est pas configurée." },
      { status: 503 }
    );
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Configuration incomplète." },
      { status: 503 }
    );
  }

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const monthKey = format(now, "yyyy-MM");
  const weekKey = `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;

  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id,whatsapp_phone,whatsapp_enabled,weekly_summary_enabled,budget_alert_threshold")
    .eq("whatsapp_enabled", true)
    .not("whatsapp_phone", "is", null);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const profiles = (profilesData || []) as EnabledProfile[];
  const userIds = profiles.map((profile) => profile.id);
  if (!userIds.length) {
    return NextResponse.json({ checked: 0, sent: 0, failed: 0 });
  }

  const [transactionsResult, budgetsResult, deliveriesResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("user_id,amount,type,category_id,categories(name)")
      .in("user_id", userIds)
      .gte("transaction_date", monthStart)
      .lte("transaction_date", monthEnd),
    supabase
      .from("budgets")
      .select("user_id,id,planned_amount,category_id,categories(name)")
      .in("user_id", userIds)
      .eq("month", now.getMonth() + 1)
      .eq("year", now.getFullYear()),
    supabase
      .from("notification_deliveries")
      .select("user_id,event_key")
      .in("user_id", userIds)
      .gte("created_at", `${monthStart}T00:00:00.000Z`)
  ]);

  const alreadySent = new Set(
    (deliveriesResult.data || []).map(
      (delivery) => `${delivery.user_id}:${delivery.event_key}`
    )
  );
  let sent = 0;
  let failed = 0;

  for (const profile of profiles) {
    if (!profile.whatsapp_phone) continue;

    const transactions = (transactionsResult.data || []).filter(
      (transaction) => transaction.user_id === profile.id
    );
    const budgets = (budgetsResult.data || []).filter(
      (budget) => budget.user_id === profile.id
    );
    const snapshot = buildBudgetSnapshot({
      transactions,
      budgets,
      now,
      alertThreshold: Number(profile.budget_alert_threshold) || 80
    });

    for (const budget of snapshot.budgets.filter(
      (item) => item.status !== "safe"
    )) {
      const eventKey = `budget:${monthKey}:${budget.id}:${budget.status}`;
      if (alreadySent.has(`${profile.id}:${eventKey}`)) continue;

      try {
        const providerMessageId = await sendWhatsAppTemplate({
          to: profile.whatsapp_phone,
          template:
            process.env.WHATSAPP_TEMPLATE_BUDGET_ALERT ||
            "frontabudget_budget_alert",
          parameters: [
            Math.round(budget.percentage),
            budget.categoryName,
            Math.round(budget.spent),
            Math.round(budget.planned)
          ]
        });

        await supabase.from("notification_deliveries").insert({
          user_id: profile.id,
          event_key: eventKey,
          channel: "whatsapp",
          provider_message_id: providerMessageId,
          status: "sent"
        });
        alreadySent.add(`${profile.id}:${eventKey}`);
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    const weeklyEventKey = `weekly:${weekKey}`;
    if (
      isMondayInFrance(now) &&
      profile.weekly_summary_enabled &&
      !alreadySent.has(`${profile.id}:${weeklyEventKey}`)
    ) {
      const tip = buildLocalInsights(snapshot)[0] || "Continue à suivre tes dépenses.";

      try {
        const providerMessageId = await sendWhatsAppTemplate({
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

        await supabase.from("notification_deliveries").insert({
          user_id: profile.id,
          event_key: weeklyEventKey,
          channel: "whatsapp",
          provider_message_id: providerMessageId,
          status: "sent"
        });
        sent += 1;
      } catch {
        failed += 1;
      }
    }
  }

  return NextResponse.json({ checked: profiles.length, sent, failed });
}
