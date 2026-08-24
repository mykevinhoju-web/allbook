import { BRISBANE_SUBURB_NAMES } from "@/features/search/brisbane-suburbs";
import type { SearchDistanceKm, SearchSort } from "@/features/search/constants";

export type KoreanSearchIntent = {
  query: string;
  /** Canonical marketplace service filter, e.g. Hair */
  service: string;
  location: string;
  sort: SearchSort;
  minRating: number | null;
  radiusKm: SearchDistanceKm;
  notes: string[];
};

const SUBURB_ALIASES: Array<{ pattern: RegExp; location: string }> = [
  { pattern: /브리즈번|브리스번|\bbrisbane\b/i, location: "Brisbane City" },
  {
    pattern: /서니뱅크\s*힐스|sunnybank\s*hills/i,
    location: "Sunnybank Hills",
  },
  { pattern: /서니뱅크|\bsunnybank\b/i, location: "Sunnybank" },
];

function detectService(normalized: string): { service: string; note: string } {
  if (/네일|마니큐어|manicure|\bnails?\b/.test(normalized)) {
    return { service: "Nails", note: "업종: Nails" };
  }
  if (/바버|이발|\bbarber\b/.test(normalized)) {
    return { service: "Barber", note: "업종: Barber" };
  }
  if (/마사지|\bmassage\b/.test(normalized)) {
    return { service: "Massage", note: "업종: Massage" };
  }
  if (/스파|\bspa\b/.test(normalized)) {
    return { service: "Spa", note: "업종: Spa" };
  }
  // 미용실 / 헤어 / hair — default for the Korean home examples
  if (/미용|헤어|머리|\bhair\b|salon/.test(normalized)) {
    return { service: "Hair", note: "업종: Hair" };
  }
  return { service: "Hair", note: "업종 미검출 → Hair 기본" };
}

function detectLocation(text: string): { location: string; note: string } | null {
  for (const alias of SUBURB_ALIASES) {
    if (alias.pattern.test(text)) {
      return { location: alias.location, note: `위치: ${alias.location}` };
    }
  }

  const lower = text.toLowerCase();
  const names = [...BRISBANE_SUBURB_NAMES].sort((a, b) => b.length - a.length);
  for (const name of names) {
    if (name.length < 3) continue;
    if (lower.includes(name.toLowerCase())) {
      return { location: name, note: `위치: ${name}` };
    }
  }
  return null;
}

function detectPriceSort(normalized: string): boolean {
  return /싼|저렴|싸게|가성비|싼값|cheap|inexpensive|budget/.test(normalized);
}

function detectRatingSort(normalized: string): boolean {
  return /평점|별점|리뷰\s*좋|평이 좋|높은 미용|인기 있|\brating\b|top rated|best review/.test(
    normalized,
  );
}

function detectNearby(normalized: string): boolean {
  return /가까운|근처|내 주변|가까이|near me|nearby|closest/.test(normalized);
}

/**
 * Rule-based Korean (and mixed EN) query parser.
 * No LLM — canonical filters stay English for the existing search engine.
 */
export function parseKoreanQuery(rawQuery: string): KoreanSearchIntent {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  const notes: string[] = [];

  const service = detectService(normalized);
  notes.push(service.note);

  const locationHit = detectLocation(query);
  const nearby = detectNearby(normalized);
  const cheap = detectPriceSort(normalized);
  const highRated = detectRatingSort(normalized);

  let location = locationHit?.location ?? "";
  if (locationHit) notes.push(locationHit.note);

  if (!location && nearby) {
    location = "Brisbane City";
    notes.push("가까운 검색 → Brisbane City 기본");
  }
  if (!location) {
    location = "Brisbane City";
    notes.push("위치 미검출 → Brisbane City 기본");
  }

  let sort: SearchSort = "distance";
  let minRating: number | null = null;
  let radiusKm: SearchDistanceKm = 20;

  if (cheap) {
    sort = "price";
    notes.push("가격: 낮은 순");
  } else if (highRated) {
    sort = "rating";
    minRating = 4;
    notes.push("평점: 4.0+ · 높은 순");
  } else if (nearby) {
    sort = "distance";
    radiusKm = 10;
    notes.push("거리: 가까운 순");
  } else if (locationHit) {
    sort = "distance";
    radiusKm = 10;
  }

  return {
    query,
    service: service.service,
    location,
    sort,
    minRating,
    radiusKm,
    notes,
  };
}
