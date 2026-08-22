import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"), "/onboarding");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin), {
        headers: { "Cache-Control": "no-store" }
      });
    }
  }

  return NextResponse.redirect(
    new URL("/auth/error?error=auth_callback_failed", url.origin),
    { headers: { "Cache-Control": "no-store" } }
  );
}
