import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, user } = await requireUser();
  const expectedPath = `${user.id}/avatar`;
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.avatar_path !== expectedPath) {
    return new NextResponse(null, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("avatars")
    .download(expectedPath);

  if (error || !data) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = ["image/jpeg", "image/png", "image/webp"].includes(data.type)
    ? data.type
    : "image/jpeg";

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
