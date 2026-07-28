import { formatDisplayDate } from "@/lib/display-locale";

import type { BookingTimeSlotOption } from "../components/schedule/booking-form-sheet";
import {
  addDaysToDateInput,
  isoToDatetimeLocal,
} from "./schedule-utils";
import { slotToIso } from "./compact-time-picker-utils";

export type DayPeriod = "AM" | "PM";

export interface BookableDateOption {
  value: string;
  monthKey: string;
  monthLabel: string;
  day: number;
  dayLabel: string;
}

export interface SlotClockParts {
  period: DayPeriod;
  hour12: number;
  minute: number;
  iso: string;
}

/** Month dropdown covers this many calendar months from today. */
export const BOOKABLE_MONTHS = 3;
/** Day dropdown shows about one week of options per selected month. */
export const BOOKABLE_DAYS_PER_MONTH = 7;
/** Generate enough days to cover BOOKABLE_MONTHS. */
const BOOKABLE_DAYS_AHEAD = BOOKABLE_MONTHS * 31;
const MINUTE_STEP = 10;

export function buildBookableDateOptions(
  today: string,
  daysAhead = BOOKABLE_DAYS_AHEAD,
): BookableDateOption[] {
  const all = Array.from({ length: daysAhead + 1 }, (_, index) => {
    const value = addDaysToDateInput(today, index);
    const monthKey = value.slice(0, 7);
    const day = Number(value.slice(8, 10));
    return {
      value,
      monthKey,
      monthLabel: formatDisplayDate(`${value}T12:00:00`, { month: "short" }),
      day,
      dayLabel: formatDisplayDate(`${value}T12:00:00`, {
        weekday: "short",
        day: "numeric",
      }),
    };
  });

  const monthKeys: string[] = [];
  for (const option of all) {
    if (!monthKeys.includes(option.monthKey)) {
      monthKeys.push(option.monthKey);
    }
    if (monthKeys.length >= BOOKABLE_MONTHS) break;
  }
  const allowed = new Set(monthKeys.slice(0, BOOKABLE_MONTHS));
  return all.filter((option) => allowed.has(option.monthKey));
}

export function uniqueMonths(
  options: BookableDateOption[],
): { key: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const option of options) {
    if (!seen.has(option.monthKey)) {
      seen.set(option.monthKey, option.monthLabel);
    }
  }
  return [...seen.entries()].map(([key, label]) => ({ key, label }));
}

/**
 * Days for the selected month — about one week, so the list stays short.
 * Current month: next days from today. Later months: first week of that month.
 * Always keeps `selectedDate` in the list when it falls in this month.
 */
export function daysForMonth(
  options: BookableDateOption[],
  monthKey: string,
  dayLimit = BOOKABLE_DAYS_PER_MONTH,
  selectedDate?: string,
): BookableDateOption[] {
  const inMonth = options.filter((option) => option.monthKey === monthKey);
  if (dayLimit <= 0) return inMonth;

  const limited = inMonth.slice(0, dayLimit);
  if (
    !selectedDate ||
    !selectedDate.startsWith(monthKey) ||
    limited.some((option) => option.value === selectedDate)
  ) {
    return limited;
  }

  const selected = inMonth.find((option) => option.value === selectedDate);
  if (!selected) return limited;

  return [...limited.slice(0, Math.max(0, dayLimit - 1)), selected].sort((a, b) =>
    a.value.localeCompare(b.value),
  );
}

export function parseSlotClock(
  date: string,
  value: string,
  timeZone: string,
): SlotClockParts {
  const iso = slotToIso(date, value);
  const local = isoToDatetimeLocal(iso, timeZone);
  const hour24 = Number(local.slice(11, 13));
  const minute = Number(local.slice(14, 16));
  const period: DayPeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { period, hour12, minute, iso };
}

export function buildSlotClocks(
  slotOptions: BookingTimeSlotOption[],
  date: string,
  timeZone: string,
): SlotClockParts[] {
  return slotOptions
    .map((slot) => parseSlotClock(date, slot.value, timeZone))
    .sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime());
}

export function availablePeriods(clocks: SlotClockParts[]): DayPeriod[] {
  const set = new Set(clocks.map((clock) => clock.period));
  return (["AM", "PM"] as const).filter((period) => set.has(period));
}

export function availableHours(
  clocks: SlotClockParts[],
  period: DayPeriod | "",
): number[] {
  if (!period) return [];
  return [
    ...new Set(
      clocks
        .filter((clock) => clock.period === period)
        .map((clock) => clock.hour12),
    ),
  ].sort((a, b) => a - b);
}

export function availableMinutes(
  clocks: SlotClockParts[],
  period: DayPeriod | "",
  hour12: number | "",
): number[] {
  if (!period || hour12 === "") return [];
  return [
    ...new Set(
      clocks
        .filter(
          (clock) => clock.period === period && clock.hour12 === hour12,
        )
        .map((clock) => clock.minute),
    ),
  ]
    .filter((minute) => minute % MINUTE_STEP === 0)
    .sort((a, b) => a - b);
}

export function findSlotIso(
  clocks: SlotClockParts[],
  period: DayPeriod | "",
  hour12: number | "",
  minute: number | "",
): string {
  if (!period || hour12 === "" || minute === "") return "";
  return (
    clocks.find(
      (clock) =>
        clock.period === period &&
        clock.hour12 === hour12 &&
        clock.minute === minute,
    )?.iso ?? ""
  );
}

export function padMinute(minute: number): string {
  return String(minute).padStart(2, "0");
}
