import { NextResponse } from "next/server";

function getGeocodeApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  );
}

function pickSuburbLabel(components: Array<{
  long_name?: string;
  short_name?: string;
  types?: string[];
}>): string | null {
  const byType = (type: string) =>
    components.find((c) => c.types?.includes(type))?.long_name?.trim() || null;

  return (
    byType("suburb") ||
    byType("locality") ||
    byType("sublocality") ||
    byType("neighborhood") ||
    byType("postal_town") ||
    null
  );
}

/**
 * Reverse-geocode device coordinates → suburb label for marketplace search.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng are required" },
      { status: 400 },
    );
  }

  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const apiKey = getGeocodeApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured" },
      { status: 500 },
    );
  }

  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: apiKey,
    result_type: "suburb|locality|sublocality|neighborhood",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    { next: { revalidate: 60 * 60 * 24 } },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: `Reverse geocode failed (${response.status})` },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as {
    status: string;
    results?: Array<{
      formatted_address?: string;
      address_components?: Array<{
        long_name?: string;
        short_name?: string;
        types?: string[];
      }>;
    }>;
    error_message?: string;
  };

  if (payload.status !== "OK" || !payload.results?.[0]) {
    return NextResponse.json(
      {
        error:
          payload.error_message ||
          "Could not resolve a suburb for this location",
      },
      { status: 404 },
    );
  }

  const top = payload.results[0];
  const label =
    pickSuburbLabel(top.address_components ?? []) ||
    top.formatted_address?.split(",")[0]?.trim() ||
    "Near me";

  return NextResponse.json({
    label,
    lat,
    lng,
    formattedAddress: top.formatted_address ?? label,
  });
}
