import { BRISBANE_SUBURB_NAMES } from "@/features/search/brisbane-suburbs";
import type { SearchDistanceKm, SearchSort } from "@/features/search/constants";

export type KoreanSearchIntent = {
  query: string;
  service: string;
  serviceLabel: string | null;
  location: string;
  /** True when the query named a suburb/city (not the Brisbane default). */
  locationExplicit: boolean;
  sort: SearchSort;
  minRating: number | null;
  maxPrice: number | null;
  radiusKm: SearchDistanceKm;
  bookableOnly: boolean;
  priceLow: boolean;
  ratingHigh: boolean;
  near: boolean;
  /** YYYY-MM-DD in Australia/Brisbane, only when the query names a day. */
  bookingDate: string | null;
  /** HH:mm inclusive lower bound, only when the query names a time. */
  timeAfter: string | null;
  notes: string[];
};

export type KoreanSearchCriterionChip = {
  key: string;
  label: string;
  value: string;
};

const DEFAULT_LOCATION = "Brisbane City";

/** Other AU cities are hidden for kor v1 (Brisbane-only). */
const OTHER_CITY_PATTERN =
  /시드니|sydney|멜버른|melbourne|퍼스|perth|애들레이드|adelaide|캔버라|canberra|골드코스트|gold\s*coast|호바트|hobart|다윈|darwin/i;

const SUBURB_ALIASES: Array<{ pattern: RegExp; location: string }> = [
  { pattern: /브리즈번|브리스번|\bbrisbane\b/i, location: "Brisbane City" },
  {
    pattern: /서니뱅크\s*힐스|써니뱅크\s*힐스|sunnybank\s*hills/i,
    location: "Sunnybank Hills",
  },
  { pattern: /서니뱅크|써니뱅크|\bsunnybank\b/i, location: "Sunnybank" },
];

function brisbaneTodayIso(daysFromToday = 0): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const utc = Date.UTC(year, month - 1, day + daysFromToday);
  const shifted = new Date(utc);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function detectService(
  normalized: string,
): { service: string; label: string } | null {
  if (/한식당|한식|식당|레스토랑|\brestaurants?\b|\bkorean\s*bbq\b/.test(normalized)) {
    return { service: "Restaurant", label: "한식당" };
  }
  if (/마트|정육|떡집|슈퍼|grocery|\bmart\b/.test(normalized)) {
    return { service: "Mart", label: "마트" };
  }
  if (/병원|치과|안경|의원|클리닉|상담|치료|\bdentist\b|\bclinic\b|\bdoctor\b/.test(normalized)) {
    return { service: "Medical", label: "병원" };
  }
  if (/학원|유학|레슨|과외|\bacademy\b|\btutor/.test(normalized)) {
    return { service: "Academy", label: "학원" };
  }
  if (/노래방|당구|골프|스포츠|karaoke|\bbilliard/.test(normalized)) {
    return { service: "Entertainment", label: "노래방" };
  }
  if (
    /변호사|회계|부동산|정비|청소|이사|택배|여행|픽업|에어컨|전기|솔라|인테리어|통역|번역|보험|파이낸스|변호사|lawyer|accountant/.test(
      normalized,
    )
  ) {
    return { service: "Services", label: "생활서비스" };
  }
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
  if (/미용|헤어|머리|한인\s*미용|\bhair\b|salon/.test(normalized)) {
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

function detectMinRating(normalized: string): number | null {
  const match = /(?:평점|별점)\s*(\d(?:\.\d)?)\s*(?:점\s*)?이상/.exec(
    normalized,
  );
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0 || value > 5) return null;
  return value;
}

function detectMaxPrice(normalized: string): number | null {
  const match =
    /(?:\$\s*)?(\d+)\s*(?:불|달러|\$)?\s*이하|(?:최대|최고)\s*\$?\s*(\d+)/.exec(
      normalized,
    );
  if (!match) return null;
  const value = Number(match[1] || match[2]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

function detectBookingDate(normalized: string): string | null {
  if (/오늘/.test(normalized)) return brisbaneTodayIso(0);
  if (/내일/.test(normalized)) return brisbaneTodayIso(1);
  if (/모레/.test(normalized)) return brisbaneTodayIso(2);
  return null;
}

function detectTimeAfter(normalized: string): string | null {
  const pm = /오후\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?\s*이후/.exec(
    normalized,
  );
  if (pm) {
    let hour = Number(pm[1]);
    const minute = Number(pm[2] || 0);
    if (hour < 12) hour += 12;
    if (hour > 23) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  const am = /오전\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?\s*이후/.exec(
    normalized,
  );
  if (am) {
    const hour = Number(am[1]);
    const minute = Number(am[2] || 0);
    if (hour > 23) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  const clock = /(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?\s*이후/.exec(normalized);
  if (clock) {
    let hour = Number(clock[1]);
    const minute = Number(clock[2] || 0);
    if (hour <= 7) hour += 12;
    if (hour > 23) return null;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  return null;
}

function detectPriceLow(normalized: string): boolean {
  return /싼|저렴|싸게|가성비|싼값|가장 싸|cheap|inexpensive|budget/.test(
    normalized,
  );
}

function detectRatingHigh(normalized: string): boolean {
  return /평점\s*높|평점\s*좋|별점\s*높|리뷰\s*좋|평이 좋|\btop rated\b|best review/.test(
    normalized,
  );
}

function detectNearby(normalized: string): boolean {
  return /가까운|가까우면서|근처|내 주변|가까이|near me|nearby|closest/.test(
    normalized,
  );
}

function detectBookableOnly(normalized: string): boolean {
  return /오늘\s*예약|예약\s*가능|예약할 수|온라인\s*예약|\bbookable\b/.test(
    normalized,
  );
}

function formatDateLabel(iso: string): string {
  const today = brisbaneTodayIso(0);
  const tomorrow = brisbaneTodayIso(1);
  if (iso === today) return "오늘";
  if (iso === tomorrow) return "내일";
  return iso;
}

/** Chips for extracted criteria only. */
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
  if (intent.near) {
    chips.push({ key: "distance", label: "거리", value: "가까운 순" });
  }
  if (intent.minRating != null) {
    chips.push({
      key: "minRating",
      label: "최소 평점",
      value: `${intent.minRating} 이상`,
    });
  } else if (intent.ratingHigh) {
    chips.push({ key: "rating", label: "평점", value: "높은 순" });
  }
  if (intent.maxPrice != null) {
    chips.push({
      key: "maxPrice",
      label: "최대 가격",
      value: `$${intent.maxPrice} 이하`,
    });
  } else if (intent.priceLow) {
    chips.push({ key: "price", label: "가격", value: "낮은 순" });
  }
  if (intent.bookableOnly) {
    chips.push({ key: "bookable", label: "예약 가능 여부", value: "가능" });
  }
  if (intent.bookingDate) {
    chips.push({
      key: "date",
      label: "날짜",
      value: formatDateLabel(intent.bookingDate),
    });
  }
  if (intent.timeAfter) {
    chips.push({
      key: "time",
      label: "시간",
      value: `${intent.timeAfter} 이후`,
    });
  }
  return chips;
}

/**
 * Rule-based Korean query parser. Combines all matched filters.
 * kor v1 is Brisbane-only: default location Brisbane City; other cities are ignored.
 */
export function parseKoreanQuery(rawQuery: string): KoreanSearchIntent {
  const query = rawQuery.trim();
  const normalized = query.toLowerCase();
  const notes: string[] = [];

  const serviceHit = detectService(normalized);
  const otherCity = OTHER_CITY_PATTERN.test(query);
  const detectedLocation = detectLocation(query);
  const locationExplicit = Boolean(detectedLocation);
  const location = detectedLocation || DEFAULT_LOCATION;
  const near = detectNearby(normalized);
  const priceLow = detectPriceLow(normalized);
  const minRating = detectMinRating(normalized);
  const ratingHigh = minRating == null && detectRatingHigh(normalized);
  const maxPrice = detectMaxPrice(normalized);
  const bookableOnly = detectBookableOnly(normalized);
  const bookingDate = detectBookingDate(normalized);
  const timeAfter = detectTimeAfter(normalized);

  if (serviceHit) notes.push(`업종: ${serviceHit.label}`);
  notes.push(`지역: ${location}`);
  if (otherCity) {
    notes.push("지금은 브리즈번만 지원합니다");
  }
  if (near) notes.push("거리: 가까운 순");
  if (minRating != null) notes.push(`최소 평점: ${minRating} 이상`);
  else if (ratingHigh) notes.push("평점: 높은 순");
  if (maxPrice != null) notes.push(`최대 가격: $${maxPrice} 이하`);
  else if (priceLow) notes.push("가격: 낮은 순");
  if (bookableOnly) notes.push("예약 가능 여부: 가능");
  if (bookingDate) notes.push(`날짜: ${formatDateLabel(bookingDate)}`);
  if (timeAfter) notes.push(`시간: ${timeAfter} 이후`);

  let sort: SearchSort = "distance";
  let radiusKm: SearchDistanceKm = 20;

  if (near || locationExplicit) {
    radiusKm = 10;
  }

  if (near) {
    sort = "distance";
  } else if (priceLow || maxPrice != null) {
    sort = "price";
  } else if (ratingHigh || minRating != null) {
    sort = "rating";
  } else {
    sort = "distance";
  }

  return {
    query,
    service: serviceHit?.service ?? "",
    serviceLabel: serviceHit?.label ?? null,
    location,
    locationExplicit,
    sort,
    minRating,
    maxPrice,
    radiusKm,
    bookableOnly,
    priceLow,
    ratingHigh,
    near,
    bookingDate,
    timeAfter,
    notes,
  };
}
