import type {
  AmenityId,
  DayOfWeek,
  OpeningHours,
  OpeningHoursDay,
  SalonDetail,
  SalonGalleryImage,
  SalonRow,
} from "@/types/salon";

import { DAY_OF_WEEK_ORDER, isAmenityId } from "./constants";
import { mapSalonRow } from "./getSalons";

function parseOpeningDay(value: unknown): OpeningHoursDay | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const open = typeof row.open === "string" ? row.open : "09:00";
  const close = typeof row.close === "string" ? row.close : "17:00";
  const closed = Boolean(row.closed);
  return { open, close, closed };
}

export function parseOpeningHours(raw: unknown): OpeningHours {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const hours: OpeningHours = {};

  for (const day of DAY_OF_WEEK_ORDER) {
    const parsed = parseOpeningDay(source[day]);
    if (parsed) hours[day] = parsed;
  }

  return hours;
}

export function mapAmenities(raw: string[] | null | undefined): AmenityId[] {
  if (!raw?.length) return [];
  return raw.filter(isAmenityId);
}

export function mapSalonDetail(
  row: SalonRow,
  gallery: SalonGalleryImage[] = [],
): SalonDetail {
  const base = mapSalonRow(row);
  return {
    ...base,
    amenities: mapAmenities(row.amenities),
    serviceTags: (row.service_tags ?? []).filter(Boolean),
    openingHours: parseOpeningHours(row.opening_hours),
    gallery,
  };
}

export function formatSalonFullAddress(salon: {
  address: string | null;
  suburb: string;
  city: string;
  state: string;
  postcode: string | null;
  country: string;
}): string {
  return [
    salon.address,
    [salon.suburb, salon.city].filter(Boolean).join(", "),
    [salon.state, salon.postcode].filter(Boolean).join(" "),
    salon.country,
  ]
    .filter(Boolean)
    .join(", ");
}

export function buildDirectionsUrl(salon: {
  latitude: number;
  longitude: number;
  name: string;
}): string {
  const query = encodeURIComponent(
    `${salon.name}@${salon.latitude},${salon.longitude}`,
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export function todayDayKey(date = new Date()): DayOfWeek {
  const map: DayOfWeek[] = [
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "sat",
  ];
  return map[date.getDay()] ?? "mon";
}
