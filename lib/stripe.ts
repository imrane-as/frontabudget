import "server-only";
import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("Configuration Stripe serveur incomplète.");
  }

  return new Stripe(key, {
    appInfo: {
      name: "FrontaBudget",
      version: "1.0.0"
    }
  });
}
