import {
  buildGeocodeAddress,
  type LatLngLiteral,
} from "@/lib/google-maps";

export type GeocodeResult = {
  center: LatLngLiteral;
  formattedAddress: string;
};

function getGeocodeApiKey(): string | undefined {
  return (
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    undefined
  );
}

/**
 * Server-side Geocoding for search origin (suburb → lat/lng).
 */
export async function geocodeSearchLocation(
  location: string,
): Promise<GeocodeResult | null> {
  const query = location.trim();
  if (!query) return null;

  const apiKey = getGeocodeApiKey();
  if (!apiKey) {
    throw new Error("Google Maps API key is not configured for geocoding");
  }

  const params = new URLSearchParams({
    address: buildGeocodeAddress(query),
    components: "country:AU",
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
    { next: { revalidate: 60 * 60 * 24 } },
  );

  if (!response.ok) {
    throw new Error(`Geocoding request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    status: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
    error_message?: string;
  };

  if (payload.status !== "OK" || !payload.results?.[0]) {
    return null;
  }

  const top = payload.results[0];
  return {
    center: {
      lat: top.geometry.location.lat,
      lng: top.geometry.location.lng,
    },
    formattedAddress: top.formatted_address,
  };
}
