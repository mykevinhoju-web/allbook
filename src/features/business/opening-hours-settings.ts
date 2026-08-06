import type { OpeningHours, OpeningHoursDay } from "@/types/salon";

import { BUSINESS_DAY_ORDER, defaultOpeningHours } from "./types";

function parseDay(value: unknown): OpeningHoursDay | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    open: typeof row.open === "string" ? row.open : "09:00",
    close: typeof row.close === "string" ? row.close : "17:00",
    closed: Boolean(row.closed),
  };
}

/** Parse salons.opening_hours jsonb into day hours only (no business settings). */
export function parseBusinessOpeningHours(raw: unknown): OpeningHours {
  const hours: OpeningHours = { ...defaultOpeningHours() };
  if (!raw || typeof raw !== "object") return hours;

  const source = raw as Record<string, unknown>;
  for (const day of BUSINESS_DAY_ORDER) {
    const parsed = parseDay(source[day]);
    if (parsed) hours[day] = parsed;
  }
  return hours;
}

/** Serialize day hours only — never embed business settings. */
export function serializeBusinessOpeningHours(
  hours: OpeningHours,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const day of BUSINESS_DAY_ORDER) {
    const row = hours[day];
    if (row) payload[day] = row;
  }
  return payload;
}
