import { NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"])
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe n'est pas encore configuré." },
      { status: 503 }
    );
  }

  const { supabase, user } = await requireUser();
  const parsed = schema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  const price =
    parsed.data.plan === "monthly"
      ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
      : process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

  if (!price) {
    return NextResponse.json(
      { error: "Price ID Stripe manquant." },
      { status: 503 }
    );
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    customerId = customer.id;

    await supabase.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan: "free",
      status: "inactive"
    });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price, quantity: 1 }],
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/settings?checkout=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        billing_period: parsed.data.plan
      }
    }
  });

  return NextResponse.json({ url: session.url });
}
