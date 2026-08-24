import { buildSalonPathFromService } from "@/features/category";
import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";

import { parseKoreanQuery, type KoreanSearchIntent } from "./parse-korean-query";

export type KoreanSearchHit = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  price: number;
  location: string;
  detailPath: string;
};

export type KoreanSearchResponse = {
  ok: true;
  intent: KoreanSearchIntent;
  results: KoreanSearchHit[];
  total: number;
};

export async function runKoreanSearch(
  rawQuery: string,
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
      page: 1,
      pageSize: 20,
    },
    { skipGoogleFill: true },
  );

  const results: KoreanSearchHit[] = result.salons.map((salon) => ({
    id: salon.id,
    name: salon.name,
    rating: salon.rating,
    reviewCount: salon.reviewCount,
    price: salon.price,
    location: [salon.suburb, salon.city].filter(Boolean).join(", "),
    detailPath: buildSalonPathFromService(salon.service, salon.slug),
  }));

  return {
    ok: true,
    intent,
    results,
    total: result.total,
  };
}
