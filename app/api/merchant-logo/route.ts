import { NextResponse } from "next/server";
import { normalizeMerchantDomain } from "@/lib/transaction-categorizer";

const MAX_LOGO_BYTES = 256 * 1024;
const errorHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const domain = normalizeMerchantDomain(
    new URL(request.url).searchParams.get("domain")
  );

  if (!domain) {
    return NextResponse.json(
      { error: "Domaine invalide." },
      { status: 400, headers: errorHeaders }
    );
  }

  const upstreamUrl = new URL("https://www.google.com/s2/favicons");
  upstreamUrl.searchParams.set("domain_url", `https://${domain}`);
  upstreamUrl.searchParams.set("sz", "128");

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "image/png,image/webp,image/x-icon" },
      redirect: "error",
      signal: AbortSignal.timeout(5_000)
    });

    const contentType = response.headers.get("content-type") || "";
    const announcedSize = Number(response.headers.get("content-length") || 0);

    if (
      !response.ok ||
      !contentType.startsWith("image/") ||
      announcedSize > MAX_LOGO_BYTES
    ) {
      return new NextResponse(null, { status: 404, headers: errorHeaders });
    }

    const logo = await response.arrayBuffer();

    if (!logo.byteLength || logo.byteLength > MAX_LOGO_BYTES) {
      return new NextResponse(null, { status: 404, headers: errorHeaders });
    }

    return new NextResponse(logo, {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox"
      }
    });
  } catch {
    return new NextResponse(null, { status: 404, headers: errorHeaders });
  }
}
