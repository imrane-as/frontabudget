import "server-only";

const FALLBACK_ORIGIN = "https://frontabudget.invalid";

export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback: string
) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, FALLBACK_ORIGIN);

    if (parsed.origin !== FALLBACK_ORIGIN) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

function configuredAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (!configured) {
    return null;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (!origin || fetchSite === "cross-site") {
    return false;
  }

  const configuredOrigin = configuredAppOrigin();
  const requestOrigin = new URL(request.url).origin;
  const isProductionDeployment =
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview";
  const allowedOrigins = new Set<string>();

  if (isProductionDeployment && configuredOrigin) {
    allowedOrigins.add(configuredOrigin);
  } else {
    allowedOrigins.add(requestOrigin);

    if (configuredOrigin) {
      allowedOrigins.add(configuredOrigin);
    }
  }

  return allowedOrigins.has(origin);
}

export function productionAppOrigin(request: Request) {
  const requestOrigin = new URL(request.url).origin;

  if (process.env.VERCEL_ENV === "preview") {
    return requestOrigin;
  }

  const configuredOrigin = configuredAppOrigin();

  if (configuredOrigin) {
    if (
      process.env.NODE_ENV === "production" &&
      !configuredOrigin.startsWith("https://")
    ) {
      throw new Error("NEXT_PUBLIC_APP_URL doit utiliser HTTPS en production.");
    }

    return configuredOrigin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL est obligatoire en production.");
  }

  return requestOrigin;
}
