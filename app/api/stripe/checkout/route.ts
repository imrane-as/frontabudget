import { NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";
import { isSameOriginRequest, productionAppOrigin } from "@/lib/security";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"])
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "Origine de la requête refusée." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;

  if (authError || !user) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = await consumeRateLimit(supabase, "stripe_checkout");

  if (!rateLimit.configured) {
    return NextResponse.json(
      { error: "Protection anti-abus indisponible." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie plus tard." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfter)
        }
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Plan invalide." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return NextResponse.json(
      { error: "Paiement serveur non configuré." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const stripe = getStripe();

  const price =
    parsed.data.plan === "monthly"
      ? process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
      : process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID;

  if (!price) {
    return NextResponse.json(
      { error: "Price ID Stripe manquant." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create(
      {
        email: user.email,
        metadata: { supabase_user_id: user.id }
      },
      { idempotencyKey: `frontabudget-customer-${user.id}` }
    );
    customerId = customer.id;

    const admin = createAdminClient();
    const { error: customerSaveError } = await admin.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan: "free",
      status: "inactive"
    });

    if (customerSaveError) {
      return NextResponse.json(
        { error: "Impossible de préparer le paiement." },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
  }

  let baseUrl: string;

  try {
    baseUrl = productionAppOrigin(request);
  } catch {
    return NextResponse.json(
      { error: "URL de production non configurée." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
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
    },
    {
      idempotencyKey: `frontabudget-checkout-${user.id}-${parsed.data.plan}-${Math.floor(Date.now() / 300000)}`
    }
  );

  if (!session.url) {
    return NextResponse.json(
      { error: "Session de paiement indisponible." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { url: session.url },
    { headers: { "Cache-Control": "no-store" } }
  );
}
