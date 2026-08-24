import { BRISBANE_SUBURB_NAMES } from "@/features/search/brisbane-suburbs";
import type { SearchDistanceKm, SearchSort } from "@/features/search/constants";

export type KoreanSearchIntent = {
  query: string;
  /** Canonical marketplace service filter, e.g. Hair. Empty when not in the query. */
  service: string;
  /** Korean (or suburb) label for the extracted service, if any. */
  serviceLabel: string | null;
  location: string;
  sort: SearchSort;
  minRating: number | null;
  radiusKm: SearchDistanceKm;
  bookableOnly: boolean;
  priceLow: boolean;
  ratingHigh: boolean;
  near: boolean;
  notes: string[];
};

export type KoreanSearchCriterionChip = {
  key: string;
  label: string;
  value: string;
};

const SUBURB_ALIASES: Array<{ pattern: RegExp; location: string }> = [
  { pattern: /브리즈번|브리스번|\bbrisbane\b/i, location: "Brisbane City" },
  {
    pattern: /서니뱅크\s*힐스|sunnybank\s*hills/i,
    location: "Sunnybank Hills",
  },
  { pattern: /서니뱅크|\bsunnybank\b/i, location: "Sunnybank" },
];

function detectService(
  normalized: string,
): { service: string; label: string } | null {
  if (/네일|마니큐어|manicure|\bnails?\b/.test(normalized)) {
    return { service: "Nails", label: "네일" };
  }
  if (/바버|이발|\bbarber\b/.test(normalized)) {
    return { service: "Barber", label: "바버" };
  }
  if (/마사지|\bmassage\b/.test(normalized)) {
    return { service: "Massage", label: "마사지" };
  }
  if (/스파|\bspa\b/.test(normalized)) {
    return { service: "Spa", label: "스파" };
  }
  if (/왁싱|\bwax/.test(normalized)) {
    return { service: "Waxing", label: "왁싱" };
  }
  if (/페이셜|피부|\bfacial\b/.test(normalized)) {
    return { service: "Facial", label: "페이셜" };
  }
  if (/속눈썹|래쉬|\blash/.test(normalized)) {
    return { service: "Lashes", label: "속눈썹" };
  }
  if (/미용|헤어|머리|\bhair\b|salon/.test(normalized)) {
    return { service: "Hair", label: "미용실" };
  }
  return null;
}

function detectLocation(text: string): string | null {
  for (const alias of SUBURB_ALIASES) {
    if (alias.pattern.test(text)) {
      return alias.location;
    }
  }

  const lower = text.toLowerCase();
  const names = [...BRISBANE_SUBURB_NAMES].sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (name.length < 3) continue;
    if (lower.includes(name.toLowerCase())) {
      return name;
    }
  }
  return null;
}

function detectPriceLow(normalized: string): boolean {
  return /싼|저렴|싸게|가성비|싼값|cheap|inexpensive|budget/.test(normalized);
}

function detectRatingHigh(normalized: string): boolean {
  return /평점\s*높|별점\s*높|리뷰\s*좋|평이 좋|\btop rated\b|best review/.test(
    normalized,
  );
}

function detectNearby(normalized: string): boolean {
  return /가까운|근처|내 주변|가까이|near me|nearby|closest/.test(normalized);
}

function detectBookableOnly(normalized: string): boolean {
  return /오늘\s*예약|예약\s*가능|예약할 수|온라인\s*예약|\bbookable\b/.test(
    normalized,
  );
}

/** Chips for “AI가 이해한 검색 조건” — only extracted fields. */
export function formatKoreanSearchCriteria(
  intent: KoreanSearchIntent,
): KoreanSearchCriterionChip[] {
  const chips: KoreanSearchCriterionChip[] = [];
  if (intent.serviceLabel) {
    chips.push({ key: "service", label: "업종", value: intent.serviceLabel });
  }
  if (intent.location) {
    chips.push({ key: "location", label: "지역", value: intent.location });
  }
  if (intent.priceLow) {
    chips.push({ key: "price", label: "가격", value: "낮은 순" });
  }
  if (intent.ratingHigh) {
    chips.push({ key: "rating", label: "평점", value: "높은 순" });
  }
  if (intent.near) {
    chips.push({ key: "distance", label: "거리", value: "가까운 순" });
  }
  if (intent.bookableOnly) {
    chips.push({ key: "bookable", label: "예약 가능 여부", value: "가능" });
  }
  return chips;
}

/**
 * Rule-based Korean (and mixed EN) query parser.
 * Missing fields stay empty — no Brisbane/Hair/minRating guesses.
 */
export function parseKoreanQuery(rawQuery: string): KoreanSearchIntent {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  const notes: string[] = [];

  const serviceHit = detectService(normalized);
  const location = detectLocation(query) ?? "";
  const near = detectNearby(normalized);
  const priceLow = detectPriceLow(normalized);
  const ratingHigh = detectRatingHigh(normalized);
  const bookableOnly = detectBookableOnly(normalized);

  if (serviceHit) notes.push(`업종: ${serviceHit.label}`);
  if (location) notes.push(`지역: ${location}`);
  if (priceLow) notes.push("가격: 낮은 순");
  if (ratingHigh) notes.push("평점: 높은 순");
  if (near) notes.push("거리: 가까운 순");
  if (bookableOnly) notes.push("예약 가능 여부: 가능");

  let sort: SearchSort = "distance";
  let radiusKm: SearchDistanceKm = 20;

  if (priceLow) {
    sort = "price";
  } else if (ratingHigh) {
    sort = "rating";
  } else if (near || location) {
    sort = "distance";
    radiusKm = 10;
  }

  return {
    query,
    service: serviceHit?.service ?? "",
    serviceLabel: serviceHit?.label ?? null,
    location,
    sort,
    minRating: null,
    radiusKm,
    bookableOnly,
    priceLow,
    ratingHigh,
    near,
    notes,
  };
}
