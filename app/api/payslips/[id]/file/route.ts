import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const id = z.string().uuid().safeParse(rawId);

  if (!id.success) return new NextResponse(null, { status: 404 });

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ message: "Authentification requise." }, { status: 401 });
  }

  const { data: payslip, error } = await supabase
    .from("payslips")
    .select("file_path,original_filename")
    .eq("id", id.data)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error || !payslip) return new NextResponse(null, { status: 404 });

  const expectedPath = `${authData.user.id}/${id.data}.pdf`;
  if (payslip.file_path !== expectedPath) return new NextResponse(null, { status: 404 });

  const { data: file, error: downloadError } = await supabase.storage
    .from("payslips")
    .download(expectedPath);

  if (downloadError || !file) return new NextResponse(null, { status: 404 });

  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  const safeAsciiName = payslip.original_filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120) || "fiche-de-paie.pdf";
  const encodedName = encodeURIComponent(payslip.original_filename);

  return new NextResponse(await file.arrayBuffer(), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Security-Policy": "sandbox",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
