import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const userIdSchema = z.string().uuid();
const MAX_WEBHOOK_BYTES = 1024 * 1024;

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json(
      { error: "Corps de requête trop volumineux." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (
    !signature ||
    !secret ||
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Webhook non configuré." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json(
      { error: "Signature webhook invalide." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = createAdminClient();

  const { data: processedEvent } = await supabase
    .from("stripe_webhook_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (processedEvent) {
    return NextResponse.json(
      { received: true, duplicate: true },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const parsedUserId = userIdSchema.safeParse(
      subscription.metadata.supabase_user_id
    );

    if (parsedUserId.success) {
      const userId = parsedUserId.data;
      const item = subscription.items.data[0];
      const { data: currentSubscription } = await supabase
        .from("subscriptions")
        .select("stripe_event_created")
        .eq("user_id", userId)
        .maybeSingle();

      if (
        !currentSubscription?.stripe_event_created ||
        event.created >= Number(currentSubscription.stripe_event_created)
      ) {
        const { error: subscriptionError } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: String(subscription.customer),
            stripe_subscription_id: subscription.id,
            plan: ["active", "trialing"].includes(subscription.status)
              ? "premium"
              : "free",
            status: subscription.status,
            price_id: item?.price.id ?? null,
            current_period_end: item?.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            stripe_event_created: event.created,
            updated_at: new Date().toISOString()
          });

        if (subscriptionError) {
          return NextResponse.json(
            { error: "Traitement temporairement indisponible." },
            { status: 500, headers: { "Cache-Control": "no-store" } }
          );
        }
      }
    }
  }

  const { error: eventSaveError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type });

  if (eventSaveError && eventSaveError.code !== "23505") {
    return NextResponse.json(
      { error: "Journalisation du webhook impossible." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { received: true },
    { headers: { "Cache-Control": "no-store" } }
  );
}
