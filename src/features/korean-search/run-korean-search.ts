import { buildSalonPathFromService } from "@/features/category";
import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";

import { parseKoreanQuery } from "./parse-korean-query";
import type {
  KoreanSearchHit,
  KoreanSearchOrigin,
  KoreanSearchResponse,
} from "./types";

export type { KoreanSearchHit, KoreanSearchOrigin, KoreanSearchResponse };

export async function runKoreanSearch(
  rawQuery: string,
  userOrigin?: KoreanSearchOrigin | null,
): Promise<KoreanSearchResponse> {
  const intent = parseKoreanQuery(rawQuery);
  const supabase = await createClient();
  const result = await searchSalons(
    supabase,
    {
      location: intent.location,
      service: intent.service,
      sort: intent.sort,
      minRating: intent.minRating,
      radiusKm: intent.radiusKm,
      latitude: userOrigin?.lat,
      longitude: userOrigin?.lng,
      page: 1,
      pageSize: 20,
    },
    { skipGoogleFill: true },
  );

  const results: KoreanSearchHit[] = result.salons
    .filter(
      (salon) =>
        Number.isFinite(salon.latitude) && Number.isFinite(salon.longitude),
    )
    .map((salon) => ({
      id: salon.id,
      name: salon.name,
      rating: salon.rating,
      reviewCount: salon.reviewCount,
      price: salon.price,
      location: [salon.suburb, salon.city].filter(Boolean).join(", "),
      suburb: salon.suburb,
      city: salon.city,
      slug: salon.slug,
      service: salon.service,
      detailPath: buildSalonPathFromService(salon.service, salon.slug),
      latitude: salon.latitude,
      longitude: salon.longitude,
      distanceKm:
        salon.distanceKm != null && Number.isFinite(salon.distanceKm)
          ? Number(salon.distanceKm)
          : null,
    }));

  return {
    ok: true,
    intent,
    origin: result.origin
      ? { lat: result.origin.lat, lng: result.origin.lng }
      : userOrigin ?? null,
    results,
    total: result.total,
  };
}
