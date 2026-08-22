import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/security";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const requestedType = searchParams.get("type");
  const allowedTypes: EmailOtpType[] = [
    "signup",
    "invite",
    "magiclink",
    "recovery",
    "email_change",
    "email"
  ];
  const type = allowedTypes.includes(requestedType as EmailOtpType)
    ? (requestedType as EmailOtpType)
    : null;
  const next = safeRedirectPath(searchParams.get("next"), "/dashboard");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url), {
        headers: { "Cache-Control": "no-store" }
      });
    }

    return NextResponse.redirect(
      new URL("/auth/error?error=invalid_or_expired_link", request.url),
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.redirect(
    new URL("/auth/error?error=invalid_confirmation_request", request.url),
    { headers: { "Cache-Control": "no-store" } }
  );
}
