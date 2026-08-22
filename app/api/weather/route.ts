import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeather } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const city = (request.nextUrl.searchParams.get("city") || "Metz")
    .trim()
    .slice(0, 80);
  const weather = await getWeather(city);

  if (!weather) {
    return NextResponse.json(
      { error: "Ville introuvable ou météo indisponible." },
      { status: 404 }
    );
  }

  return NextResponse.json(weather, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600"
    }
  });
}
