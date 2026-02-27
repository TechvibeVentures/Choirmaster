import { NextResponse } from "next/server";

type GeoapifyFeatureProperties = {
  place_id?: string;
  result_type?: string;
  city?: string;
  name?: string;
  country?: string;
};

type GeoapifyResponse = {
  features?: Array<{
    properties?: GeoapifyFeatureProperties;
  }>;
};

type CitySuggestion = {
  placeId: string;
  city: string;
  country: string;
  label: string;
};

const allowedResultTypes = new Set([
  "city",
  "town",
  "municipality",
  "locality",
  "village",
  "postcode",
  "suburb"
]);

const toSafeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeForMatch = (value: string) =>
  value
    .toLocaleLowerCase("de-DE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();

export async function GET(request: Request) {
  const apiKey = process.env.GEOAPIFY_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Geoapify is not configured.", suggestions: [] },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").trim();
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  const normalizedQuery = normalizeForMatch(query);

  try {
    const params = new URLSearchParams({
      text: query,
      type: "city",
      lang: "de",
      limit: "8",
      apiKey
    });
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "City lookup failed.", suggestions: [] },
        { status: 502 }
      );
    }

    const payload = (await response.json()) as GeoapifyResponse;
    const seen = new Set<string>();
    const suggestions: CitySuggestion[] = [];

    for (const feature of payload.features || []) {
      const properties = feature.properties || {};
      const resultType = toSafeString(properties.result_type);
      if (resultType && !allowedResultTypes.has(resultType)) continue;

      const city = toSafeString(properties.city) || toSafeString(properties.name);
      if (!city) continue;
      const normalizedCity = normalizeForMatch(city);
      if (!normalizedCity.includes(normalizedQuery)) continue;

      const country = toSafeString(properties.country);
      const placeId = toSafeString(properties.place_id) || `${city}-${country}`;
      const dedupeKey = `${city.toLocaleLowerCase("de-DE")}|${country.toLocaleLowerCase(
        "de-DE"
      )}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      suggestions.push({
        placeId,
        city,
        country,
        label: country ? `${city}, ${country}` : city
      });
    }

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "City lookup failed.", suggestions: [] },
      { status: 502 }
    );
  }
}
