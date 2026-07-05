import type { StaffStatus } from "../types";

/** Default shop hours — staff are bookable 9am–9pm on working days. */
export const DEFAULT_WORKING_HOURS_START = "09:00";
export const DEFAULT_WORKING_HOURS_END = "21:00";

export const ALL_WEEKDAY_CODES = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export type StaffDaySchedule = Record<string, boolean>;

export function parseDaySchedule(
  value: unknown,
): StaffDaySchedule {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: StaffDaySchedule = {};
  for (const [date, working] of Object.entries(value)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && typeof working === "boolean") {
      result[date] = working;
    }
  }
  return result;
}

export function isStaffWorkingOnDate(
  status: StaffStatus,
  daySchedule: StaffDaySchedule | undefined,
  date: string,
): boolean {
  if (status !== "active") return false;
  if (daySchedule?.[date] === false) return false;
  return true;
}

export function setDayWorking(
  daySchedule: StaffDaySchedule,
  date: string,
  working: boolean,
): StaffDaySchedule {
  const next = { ...daySchedule };
  if (working) {
    delete next[date];
  } else {
    next[date] = false;
  }
  return next;
}

export function upcomingScheduleDates(
  timeZone: string,
  count = 28,
  from = new Date(),
): string[] {
  const dates: string[] = [];
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (let offset = 0; offset < count; offset += 1) {
    const candidate = new Date(from.getTime() + offset * 86_400_000);
    const parts = formatter.formatToParts(candidate);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (year && month && day) {
      dates.push(`${year}-${month}-${day}`);
    }
  }

  return dates;
}
