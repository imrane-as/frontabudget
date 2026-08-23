export type GroceryPrice = {
  id: number;
  productName: string;
  quantity: string | null;
  price: number;
  currency: string;
  store: string;
  city: string;
  date: string;
};

export type GroceryMarketData = {
  city: string;
  radiusKm: number;
  observedAt: string | null;
  prices: GroceryPrice[];
};

type GeocodingResponse = {
  results?: Array<{ name: string; latitude: number; longitude: number }>;
};

type OpenPricesResponse = {
  items?: Array<{
    id: number;
    price: number;
    currency: string | null;
    date: string | null;
    product_name: string | null;
    product?: { product_name?: string | null; quantity?: string | null } | null;
    location?: {
      osm_name?: string | null;
      osm_brand?: string | null;
      osm_address_city?: string | null;
      osm_address_country_code?: string | null;
    } | null;
  }>;
};

export async function getGroceryMarket(
  city = "Metz"
): Promise<GroceryMarketData | null> {
  const normalizedCity = city.trim().slice(0, 80) || "Metz";
  const radiusKm = 25;

  try {
    const geocodingUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geocodingUrl.searchParams.set("name", normalizedCity);
    geocodingUrl.searchParams.set("count", "1");
    geocodingUrl.searchParams.set("language", "fr");
    geocodingUrl.searchParams.set("format", "json");

    const geocodingResponse = await fetch(geocodingUrl, {
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8_000)
    });
    if (!geocodingResponse.ok) return null;

    const geocoding = (await geocodingResponse.json()) as GeocodingResponse;
    const place = geocoding.results?.[0];
    if (!place) return null;

    const cutoff = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const pricesUrl = new URL("https://prices.openfoodfacts.org/api/v1/prices");
    pricesUrl.searchParams.set("lat", String(place.latitude));
    pricesUrl.searchParams.set("lon", String(place.longitude));
    pricesUrl.searchParams.set("radius_km", String(radiusKm));
    pricesUrl.searchParams.set("date__gte", cutoff);
    pricesUrl.searchParams.set("order_by", "-date");
    pricesUrl.searchParams.set("size", "50");
    pricesUrl.searchParams.set("type", "PRODUCT");

    const pricesResponse = await fetch(pricesUrl, {
      headers: { "User-Agent": "FrontaBudget/1.0" },
      next: { revalidate: 60 * 60 * 6 },
      signal: AbortSignal.timeout(8_000)
    });
    if (!pricesResponse.ok) return null;

    const payload = (await pricesResponse.json()) as OpenPricesResponse;
    const seen = new Set<string>();
    const prices: GroceryPrice[] = [];

    for (const item of payload.items || []) {
      const productName = (item.product?.product_name || item.product_name || "").trim();
      const store = (item.location?.osm_name || item.location?.osm_brand || "Commerce").trim();
      const date = item.date || "";
      const key = productName.toLocaleLowerCase("fr");

      if (
        !productName ||
        !date ||
        !Number.isFinite(item.price) ||
        item.price <= 0 ||
        item.location?.osm_address_country_code !== "FR" ||
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      prices.push({
        id: item.id,
        productName,
        quantity: item.product?.quantity || null,
        price: item.price,
        currency: item.currency || "EUR",
        store,
        city: item.location?.osm_address_city || place.name,
        date
      });

      if (prices.length === 6) break;
    }

    return {
      city: place.name,
      radiusKm,
      observedAt: prices[0]?.date || null,
      prices
    };
  } catch {
    return null;
  }
}
