import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante pour le webhook Stripe.");
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Webhook non configuré." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature webhook invalide." }, { status: 400 });
  }

  const supabase = adminClient();

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.supabase_user_id;

    if (userId) {
      const item = subscription.items.data[0];

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: String(subscription.customer),
        stripe_subscription_id: subscription.id,
        plan: subscription.status === "active" ? "premium" : "free",
        status: subscription.status,
        price_id: item?.price.id ?? null,
        current_period_end: item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString()
      });
    }
  }

  return NextResponse.json({ received: true });
}
