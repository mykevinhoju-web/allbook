import type { AmenityId, DayOfWeek } from "@/types/salon";

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export const SALON_AMENITIES: ReadonlyArray<{
  id: AmenityId;
  label: string;
}> = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "wheelchair", label: "Wheelchair" },
  { id: "coffee", label: "Coffee" },
  { id: "air_conditioning", label: "Air Conditioning" },
];

export const SALON_SERVICE_CATEGORY_ORDER = [
  "Hair",
  "Colour",
  "Treatment",
  "Barber",
  "Nails",
  "Spa",
  "Massage",
  "Facial",
  "Waxing",
  "Brows",
  "Lashes",
] as const;

/** Demo booking time slots — replace with availability API later. */
export const SALON_BOOKING_TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;

export function isAmenityId(value: string): value is AmenityId {
  return SALON_AMENITIES.some((item) => item.id === value);
}
