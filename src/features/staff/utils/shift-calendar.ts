import { addDaysToDateInput } from "@/features/booking/lib/schedule-utils";

export const DEFAULT_SHIFT_START_TIME = "09:00";
export const DEFAULT_SHIFT_END_TIME = "21:00";

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function extractClockTime(datetimeLocal: string): string {
  return datetimeLocal.slice(11, 16) || DEFAULT_SHIFT_START_TIME;
}

export function buildDatetimeLocal(date: string, time: string): string {
  const [hours, minutes = "00"] = time.split(":");
  return `${date}T${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

/** Inclusive list of YYYY-MM-DD dates covered by a shift window. */
export function enumerateShiftDates(
  shiftStartsAt: string,
  shiftEndsAt: string,
): string[] {
  if (!shiftStartsAt || !shiftEndsAt) return [];

  const startDate = shiftStartsAt.slice(0, 10);
  const endDate = shiftEndsAt.slice(0, 10);
  if (endDate < startDate) return [];

  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDaysToDateInput(cursor, 1);
  }

  return dates;
}

export function resolveShiftEndDate(
  startDate: string,
  startTime: string,
  endTime: string,
): string {
  if (endTime <= startTime) {
    return addDaysToDateInput(startDate, 1);
  }
  return startDate;
}

export function buildShiftWindow(
  startDate: string,
  startTime: string,
  endTime: string,
): { shiftStartsAt: string; shiftEndsAt: string } {
  const endDate = resolveShiftEndDate(startDate, startTime, endTime);
  return {
    shiftStartsAt: buildDatetimeLocal(startDate, startTime),
    shiftEndsAt: buildDatetimeLocal(endDate, endTime),
  };
}

export function compactTimeLabel(time: string): string {
  const [hoursRaw, minutes] = time.split(":");
  const hours = Number(hoursRaw);
  if (minutes === "00") {
    return String(hours);
  }
  return `${hours}:${minutes}`;
}

export function formatShiftDayLabel(
  date: string,
  shiftStartsAt: string,
  shiftEndsAt: string,
): string | null {
  const scheduledDates = enumerateShiftDates(shiftStartsAt, shiftEndsAt);
  if (!scheduledDates.includes(date)) return null;

  const startDate = shiftStartsAt.slice(0, 10);
  const endDate = shiftEndsAt.slice(0, 10);
  const startTime = extractClockTime(shiftStartsAt);
  const endTime = extractClockTime(shiftEndsAt);

  if (startDate === endDate) {
    return `${compactTimeLabel(startTime)}-${compactTimeLabel(endTime)}`;
  }

  if (date === startDate) {
    return `${compactTimeLabel(startTime)}→`;
  }

  if (date === endDate) {
    return `→${compactTimeLabel(endTime)}`;
  }

  return "·";
}

export function isDateWorking(
  date: string,
  daySchedule: Record<string, boolean>,
): boolean {
  return daySchedule[date] !== false;
}
