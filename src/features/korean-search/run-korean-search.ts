import { buildSalonPathFromService } from "@/features/category";
import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import { parseKoreanQuery } from "./parse-korean-query";
import type {
  KoreanSearchHit,
  KoreanSearchOrigin,
  KoreanSearchResponse,
} from "./types";

export type { KoreanSearchHit, KoreanSearchOrigin, KoreanSearchResponse };

export type RunKoreanSearchOptions = {
  /** Extra filter from the kor UI toggle — OR'd with parser bookableOnly. */
  bookableOnly?: boolean;
};

async function loadBookingEnabledById(
  supabase: SupabaseClient<Database>,
  salonIds: string[],
): Promise<Map<string, boolean>> {
  const map = new Map<string, boolean>();
  if (salonIds.length === 0) return map;

  const { data } = await supabase
    .from("salons")
    .select("id, booking_enabled")
    .in("id", salonIds);

  for (const row of data ?? []) {
    map.set(row.id, row.booking_enabled === true);
  }
  return map;
}

export async function runKoreanSearch(
  rawQuery: string,
  userOrigin?: KoreanSearchOrigin | null,
  options: RunKoreanSearchOptions = {},
): Promise<KoreanSearchResponse> {
  const parsed = parseKoreanQuery(rawQuery);
  const bookableOnly = Boolean(options.bookableOnly) || parsed.bookableOnly;
  const intent = {
    ...parsed,
    bookableOnly,
    notes: bookableOnly
      ? parsed.notes.includes("예약 가능만")
        ? parsed.notes
        : [...parsed.notes, "예약 가능만"]
      : parsed.notes,
  };

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
      pageSize: bookableOnly ? 100 : 20,
    },
    { skipGoogleFill: true },
  );

  const bookingById = await loadBookingEnabledById(
    supabase,
    result.salons.map((salon) => salon.id),
  );

  let results: KoreanSearchHit[] = result.salons
    .filter(
      (salon) =>
        Number.isFinite(salon.latitude) && Number.isFinite(salon.longitude),
    )
    .map((salon) => {
      const bookingEnabled = bookingById.get(salon.id) === true;
      const detailPath = buildSalonPathFromService(salon.service, salon.slug);
      return {
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
        detailPath,
        coverImage: salon.coverImage,
        logo: salon.logo,
        latitude: salon.latitude,
        longitude: salon.longitude,
        distanceKm:
          salon.distanceKm != null && Number.isFinite(salon.distanceKm)
            ? Number(salon.distanceKm)
            : null,
        bookingEnabled,
        bookPath: bookingEnabled ? `${detailPath}/book` : null,
      };
    });

  if (bookableOnly) {
    results = results.filter((hit) => hit.bookingEnabled);
  }

  return {
    ok: true,
    intent,
    origin: result.origin
      ? { lat: result.origin.lat, lng: result.origin.lng }
      : userOrigin ?? null,
    results,
    total: bookableOnly ? results.length : result.total,
  };
}
