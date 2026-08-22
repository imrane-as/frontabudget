import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getWeather } from "@/lib/weather";

const citySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[\p{L}\p{M}\s.'-]+$/u);

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json(
      { error: "Connexion requise." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rateLimit = await consumeRateLimit(supabase, "weather");

  if (!rateLimit.configured) {
    return NextResponse.json(
      { error: "Protection anti-abus indisponible." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes météo. Réessaie plus tard." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfter)
        }
      }
    );
  }

  const parsedCity = citySchema.safeParse(
    request.nextUrl.searchParams.get("city") || "Metz"
  );

  if (!parsedCity.success) {
    return NextResponse.json(
      { error: "Nom de ville invalide." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const city = parsedCity.data;
  const weather = await getWeather(city);

  if (!weather) {
    return NextResponse.json(
      { error: "Ville introuvable ou météo indisponible." },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
