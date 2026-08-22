import { NextResponse } from "next/server";
import { normalizeMerchantDomain } from "@/lib/transaction-categorizer";

const MAX_LOGO_BYTES = 256 * 1024;
const errorHeaders = { "Cache-Control": "no-store" };

type LogoProvider = {
  name: "brandfetch" | "curated" | "favicon";
  url: URL;
};

const CURATED_LOGOS = new Map<string, string>([
  [
    "cetelem.fr",
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/Cetelembe_amplogo-fr.png"
  ]
]);

function getLogoProviders(domain: string): LogoProvider[] {
  const providers: LogoProvider[] = [];
  const curatedLogo = CURATED_LOGOS.get(domain);
  const brandfetchClientId = process.env.BRANDFETCH_CLIENT_ID?.trim();

  if (curatedLogo) {
    providers.push({ name: "curated", url: new URL(curatedLogo) });
  }

  if (
    brandfetchClientId &&
    /^[a-zA-Z0-9_-]{1,200}$/.test(brandfetchClientId)
  ) {
    const brandfetchUrl = new URL(`https://cdn.brandfetch.io/${domain}`);
    brandfetchUrl.searchParams.set("c", brandfetchClientId);
    providers.push({ name: "brandfetch", url: brandfetchUrl });
  }

  // Google redirige /s2/favicons vers ce service. L'app utilise directement
  // l'hôte final autorisé afin de garder redirect: "error" sans casser l'image.
  const faviconUrl = new URL("https://t3.gstatic.com/faviconV2");
  faviconUrl.searchParams.set("client", "SOCIAL");
  faviconUrl.searchParams.set("type", "FAVICON");
  faviconUrl.searchParams.set("fallback_opts", "TYPE,SIZE,URL");
  faviconUrl.searchParams.set("url", `https://${domain}`);
  faviconUrl.searchParams.set("size", "128");
  providers.push({ name: "favicon", url: faviconUrl });

  return providers;
}

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

  for (const provider of getLogoProviders(domain)) {
    try {
      const response = await fetch(provider.url, {
        headers: {
          Accept: "image/png,image/webp,image/svg+xml,image/x-icon",
          "User-Agent": "FrontaBudget/1.0 merchant-logo-proxy"
        },
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
        continue;
      }

      const logo = await response.arrayBuffer();

      if (!logo.byteLength || logo.byteLength > MAX_LOGO_BYTES) {
        continue;
      }

      return new NextResponse(logo, {
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
          "Content-Type": contentType,
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "X-Logo-Source": provider.name
        }
      });
    } catch {
      // Essaie le fournisseur suivant sans exposer le détail de l'erreur.
    }
  }

  return new NextResponse(null, { status: 404, headers: errorHeaders });
}
