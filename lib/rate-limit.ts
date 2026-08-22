import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitScope =
  | "coach"
  | "weather"
  | "stripe_checkout"
  | "categorize";

const retryAfterByScope: Record<RateLimitScope, number> = {
  coach: 300,
  weather: 3600,
  stripe_checkout: 3600,
  categorize: 86400
};

export async function consumeRateLimit(
  supabase: SupabaseClient,
  scope: RateLimitScope
) {
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_scope: scope
  });

  return {
    allowed: !error && data === true,
    configured: !error,
    retryAfter: retryAfterByScope[scope]
  };
}
