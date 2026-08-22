import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

  return new Stripe(key, {
    appInfo: {
      name: "FrontaBudget",
      version: "1.0.0",
    },
  });
}