import type { OpeningHours, OpeningHoursDay } from "@/types/salon";

import {
  BUSINESS_DAY_ORDER,
  defaultOpeningHours,
  type BusinessSettings,
} from "./types";

const SETTINGS_KEY = "settings";

type HoursSettingsBlob = {
  bookingEnabled?: boolean;
  acceptNewCustomers?: boolean;
  featured?: boolean;
};

function parseDay(value: unknown): OpeningHoursDay | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    open: typeof row.open === "string" ? row.open : "09:00",
    close: typeof row.close === "string" ? row.close : "17:00",
    closed: Boolean(row.closed),
  };
}

/**
 * Split opening_hours jsonb into display hours + business settings.
 * Settings live under `settings` so we don't need new columns.
 */
export function splitOpeningHoursPayload(raw: unknown): {
  hours: OpeningHours;
  settings: HoursSettingsBlob;
} {
  const defaults = defaultOpeningHours();
  const hours: OpeningHours = { ...defaults };
  let settings: HoursSettingsBlob = {};

  if (!raw || typeof raw !== "object") {
    return { hours, settings };
  }

  const source = raw as Record<string, unknown>;
  for (const day of BUSINESS_DAY_ORDER) {
    const parsed = parseDay(source[day]);
    if (parsed) hours[day] = parsed;
  }

  const blob = source[SETTINGS_KEY];
  if (blob && typeof blob === "object") {
    settings = blob as HoursSettingsBlob;
  }

  return { hours, settings };
}

export function mergeOpeningHoursPayload(
  hours: OpeningHours,
  settings: Pick<
    BusinessSettings,
    "bookingEnabled" | "acceptNewCustomers" | "featured"
  >,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const day of BUSINESS_DAY_ORDER) {
    const row = hours[day];
    if (row) payload[day] = row;
  }
  payload[SETTINGS_KEY] = {
    bookingEnabled: settings.bookingEnabled,
    acceptNewCustomers: settings.acceptNewCustomers,
    featured: settings.featured,
  };
  return payload;
}
