import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";

import {
  DEFAULT_SHIFT_END_TIME,
  DEFAULT_SHIFT_START_TIME,
  enumerateShiftDates,
  resolveShiftEndDate,
} from "./shift-calendar";

export interface DayShiftEntry {
  startTime: string;
  endTime: string;
}

export type ShiftPlan = Record<string, DayShiftEntry>;

export function parseShiftPlan(value: unknown): ShiftPlan {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const plan: ShiftPlan = {};

  for (const [date, entry] of Object.entries(value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;

    const startTime =
      typeof (entry as DayShiftEntry).startTime === "string"
        ? (entry as DayShiftEntry).startTime.slice(0, 5)
        : null;
    const endTime =
      typeof (entry as DayShiftEntry).endTime === "string"
        ? (entry as DayShiftEntry).endTime.slice(0, 5)
        : null;

    if (startTime && endTime) {
      plan[date] = { startTime, endTime };
    }
  }

  return plan;
}

export function shiftPlanDayToWindow(
  date: string,
  entry: DayShiftEntry,
  timeZone: string,
): { shiftStartsAt: string; shiftEndsAt: string } {
  const endDate = resolveShiftEndDate(date, entry.startTime, entry.endTime);
  return {
    shiftStartsAt: datetimeLocalToIso(`${date}T${entry.startTime}`, timeZone),
    shiftEndsAt: datetimeLocalToIso(`${endDate}T${entry.endTime}`, timeZone),
  };
}

export function migrateLegacyWindowToPlan(
  shiftStartsAtLocal: string,
  shiftEndsAtLocal: string,
): ShiftPlan {
  if (!shiftStartsAtLocal || !shiftEndsAtLocal) return {};

  const startTime = shiftStartsAtLocal.slice(11, 16);
  const endTime = shiftEndsAtLocal.slice(11, 16);
  const plan: ShiftPlan = {};

  for (const date of enumerateShiftDates(shiftStartsAtLocal, shiftEndsAtLocal)) {
    plan[date] = { startTime, endTime };
  }

  return plan;
}

export function ensureShiftPlan(
  shiftPlanRaw: unknown,
  shiftStartsAtLocal: string,
  shiftEndsAtLocal: string,
): ShiftPlan {
  const parsed = parseShiftPlan(shiftPlanRaw);
  if (Object.keys(parsed).length > 0) return parsed;
  return migrateLegacyWindowToPlan(shiftStartsAtLocal, shiftEndsAtLocal);
}

export function sortedShiftPlanDates(plan: ShiftPlan): string[] {
  return Object.keys(plan).sort();
}

export function shiftPlanBounds(plan: ShiftPlan): {
  from: string;
  to: string;
} | null {
  const dates = sortedShiftPlanDates(plan);
  if (dates.length === 0) return null;
  return { from: dates[0], to: dates[dates.length - 1] };
}

export function formatShiftPlanDayLabel(
  date: string,
  plan: ShiftPlan,
): string | null {
  const entry = plan[date];
  if (!entry) return null;

  const start = compactHour(entry.startTime);
  const end = compactHour(entry.endTime);
  return `${start}-${end}`;
}

function compactHour(time: string): string {
  const [hoursRaw, minutes] = time.split(":");
  const hours = Number(hoursRaw);
  if (minutes === "00") return String(hours);
  return `${hours}:${minutes}`;
}

/** Pick today or the next scheduled day for legacy shiftStartsAt/shiftEndsAt fields. */
export function primaryShiftWindowFromPlan(
  plan: ShiftPlan,
  timeZone: string,
  now = new Date(),
): { shiftStartsAt: string; shiftEndsAt: string } | null {
  const dates = sortedShiftPlanDates(plan);
  if (dates.length === 0) return null;

  const today = todayDateInZone(timeZone, now);
  const target = plan[today] ? today : dates.find((date) => date >= today) ?? dates[0];
  const entry = plan[target];
  if (!entry) return null;

  return shiftPlanDayToWindow(target, entry, timeZone);
}

export function primaryShiftWindowLocalsFromPlan(
  plan: ShiftPlan,
  timeZone: string,
  now = new Date(),
): { shiftStartsAt: string; shiftEndsAt: string } | null {
  const iso = primaryShiftWindowFromPlan(plan, timeZone, now);
  if (!iso) return null;

  return {
    shiftStartsAt: isoToDatetimeLocal(iso.shiftStartsAt, timeZone),
    shiftEndsAt: isoToDatetimeLocal(iso.shiftEndsAt, timeZone),
  };
}

export function isDateInShiftPlan(plan: ShiftPlan, date: string): boolean {
  return Boolean(plan[date]);
}

export function deriveWorkingFieldsFromPlan(
  plan: ShiftPlan,
  dayCodeInZone: (dateStr: string) => string,
): {
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
} {
  const dates = sortedShiftPlanDates(plan);
  if (dates.length === 0) {
    return {
      workingDays: [],
      workingHoursStart: DEFAULT_SHIFT_START_TIME,
      workingHoursEnd: DEFAULT_SHIFT_END_TIME,
    };
  }

  const days = new Set<string>();
  for (const date of dates) {
    days.add(dayCodeInZone(date));
  }

  const first = plan[dates[0]];
  return {
    workingDays: [...days],
    workingHoursStart: first.startTime,
    workingHoursEnd: first.endTime,
  };
}
