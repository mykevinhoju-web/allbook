import type { DayOfWeek, OpeningHours } from "@/types/salon";

const DAY_KEYS: DayOfWeek[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

/**
 * Whether a salon is open at `at` (defaults to now, Australia/Brisbane wall clock).
 * Uses opening_hours jsonb — no schema changes.
 */
export function isSalonOpenNow(
  openingHours: OpeningHours | null | undefined,
  at: Date = new Date(),
): boolean {
  if (!openingHours) return false;

  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "0";

  const weekdayMap: Record<string, DayOfWeek> = {
    Sun: "sun",
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
  };

  const day = weekdayMap[weekday] ?? DAY_KEYS[at.getDay()];
  const today = openingHours[day];
  if (!today || today.closed) return false;

  const nowMinutes = Number(hour) * 60 + Number(minute);
  const openMinutes = parseTimeToMinutes(today.open);
  const closeMinutes = parseTimeToMinutes(today.close);
  if (openMinutes == null || closeMinutes == null) return false;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
}
