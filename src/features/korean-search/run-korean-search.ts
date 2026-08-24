import { buildSalonPathFromService } from "@/features/category";
import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import { filterHitsByBookingSlot, filterHitsOpenOnDate } from "./filter-by-booking-slot";
import { parseKoreanQuery } from "./parse-korean-query";
import type {
  KoreanSearchFunnelStep,
  KoreanSearchHit,
  KoreanSearchOrigin,
  KoreanSearchResponse,
} from "./types";

export type { KoreanSearchHit, KoreanSearchOrigin, KoreanSearchResponse };

export type RunKoreanSearchOptions = {
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

function pushFunnel(
  funnel: KoreanSearchFunnelStep[],
  label: string,
  count: number,
) {
  funnel.push({ label, count });
}

function shortageFromFunnel(
  funnel: KoreanSearchFunnelStep[],
  finalCount: number,
): string | null {
  if (funnel.length < 2) return null;

  for (let i = 1; i < funnel.length; i += 1) {
    const prev = funnel[i - 1]!;
    const step = funnel[i]!;
    if (prev.count > 0 && step.count === 0) {
      return `${step.label} 조건에 맞는 업체가 없습니다. (직전 ${prev.count}곳)`;
    }
  }

  if (finalCount > 0 && finalCount < 5) {
    let worst: KoreanSearchFunnelStep | null = null;
    let worstDrop = 0;
    for (let i = 1; i < funnel.length; i += 1) {
      const drop = funnel[i - 1]!.count - funnel[i]!.count;
      if (drop > worstDrop) {
        worstDrop = drop;
        worst = funnel[i]!;
      }
    }
    if (worst && worstDrop > 0) {
      return `${worst.label} 적용 후 ${finalCount}곳만 남았습니다. 조건은 그대로 유지했습니다.`;
    }
  }

  return null;
}

export async function runKoreanSearch(
  rawQuery: string,
  userOrigin?: KoreanSearchOrigin | null,
  options: RunKoreanSearchOptions = {},
): Promise<KoreanSearchResponse> {
  const parsed = parseKoreanQuery(rawQuery);
  const bookableOnly = Boolean(options.bookableOnly) || parsed.bookableOnly;
  const hasDate = Boolean(parsed.bookingDate);
  const hasTime = Boolean(parsed.timeAfter);
  const intent = {
    ...parsed,
    bookableOnly,
    notes: bookableOnly
      ? parsed.notes.includes("예약 가능 여부: 가능")
        ? parsed.notes
        : [...parsed.notes, "예약 가능 여부: 가능"]
      : parsed.notes,
  };

  const supabase = await createClient();
  const extraFilters =
    bookableOnly ||
    intent.maxPrice != null ||
    intent.minRating != null ||
    hasDate;
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
      pageSize: extraFilters ? 100 : 20,
    },
    { skipGoogleFill: true },
  );

  const bookingById = await loadBookingEnabledById(
    supabase,
    result.salons.map((salon) => salon.id),
  );

  const funnel: KoreanSearchFunnelStep[] = [];

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

  pushFunnel(funnel, "검색", results.length);

  if (intent.minRating != null) {
    results = results.filter((hit) => hit.rating >= intent.minRating!);
    pushFunnel(funnel, `최소 평점 ${intent.minRating} 이상`, results.length);
  }

  if (intent.maxPrice != null) {
    results = results.filter(
      (hit) => hit.price > 0 && hit.price <= intent.maxPrice!,
    );
    pushFunnel(funnel, `최대 가격 $${intent.maxPrice} 이하`, results.length);
  }

  if (bookableOnly || hasDate) {
    results = results.filter((hit) => hit.bookingEnabled);
    pushFunnel(funnel, "예약 가능", results.length);
  }

  if (hasDate && intent.bookingDate && hasTime) {
    const timeLabel = `${intent.bookingDate} ${intent.timeAfter} 이후`;
    results = await filterHitsByBookingSlot(
      results,
      intent.bookingDate,
      intent.timeAfter,
    );
    pushFunnel(funnel, `날짜/시간 ${timeLabel}`, results.length);
  } else if (hasDate && intent.bookingDate) {
    results = await filterHitsOpenOnDate(results, intent.bookingDate);
    pushFunnel(funnel, `날짜 ${intent.bookingDate} 영업`, results.length);
  }

  const shortage = shortageFromFunnel(funnel, results.length);

  return {
    ok: true,
    intent,
    origin: result.origin
      ? { lat: result.origin.lat, lng: result.origin.lng }
      : userOrigin ?? null,
    results,
    total: results.length,
    funnel,
    shortage,
  };
}
