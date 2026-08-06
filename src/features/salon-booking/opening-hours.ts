import type { OpeningHours } from "@/types/salon";

import type { BusinessHoursDay } from "./types";
import { getDayOfWeekMondayFirst } from "./time-utils";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function openingHoursForDate(
  hours: OpeningHours,
  dateIso: string,
): BusinessHoursDay {
  const day = getDayOfWeekMondayFirst(dateIso);
  const key = DAY_KEYS[day]!;
  const value = hours[key];
  if (!value) return { open: "09:00", close: "17:00", closed: true };
  return {
    open: value.open,
    close: value.close,
    closed: value.closed,
  };
}
