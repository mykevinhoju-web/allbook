import type { AdminBooking } from "../types/admin-booking";

const MINUTES_IN_DAY = 24 * 60;
const SLOT_STEP_MINUTES = 5;

/** @deprecated Use service options from API instead. */
export const BOOKING_SERVICE_DURATIONS = [20, 30, 45, 60] as const;

export function formatServiceDurationLabel(minutes: number): string {
  if (minutes === 60) return "1 hour";
  return `${minutes} min`;
}

export function isValidServiceDuration(minutes: number, allowed: number[]): boolean {
  return allowed.includes(minutes);
}

export function isStartTimeOnFiveMinuteSlot(iso: string): boolean {
  const date = new Date(iso);
  return date.getMinutes() % SLOT_STEP_MINUTES === 0;
}

export function minutesFromIso(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

export function formatScheduleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatAmPmTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatBookingSummary(booking: AdminBooking): string {
  return `${formatAmPmTime(booking.startsAt)} – ${formatAmPmTime(booking.endsAt)} · ${formatDurationLabel(booking.durationMinutes)}`;
}

export function groupTimeSlotsByHour(
  date: string,
  slots: string[],
): { hourLabel: string; slots: string[] }[] {
  const map = new Map<number, string[]>();

  for (const slot of slots) {
    const hour = Number(slot.split(":")[0]);
    if (!map.has(hour)) map.set(hour, []);
    map.get(hour)!.push(slot);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, hourSlots]) => ({
      hourLabel: formatAmPmTime(
        buildStartsAtIso(date, `${String(hour).padStart(2, "0")}:00`),
      ),
      slots: hourSlots,
    }));
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return hours === 1 ? "1hr" : `${hours}hr`;
  }

  return `${hours}hr ${remainder}min`;
}

export function formatScheduleDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function topPercentForMinute(minute: number): number {
  return (minute / MINUTES_IN_DAY) * 100;
}

export function heightPercentForDuration(durationMinutes: number): number {
  return (durationMinutes / MINUTES_IN_DAY) * 100;
}

export function todayDateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Today's YYYY-MM-DD in a tenant timezone. */
export function todayDateInZone(
  timeZone: string,
  now = new Date(),
): string {
  return toDatetimeLocalValue(now, timeZone).slice(0, 10);
}

/** Default when tenant timezone is missing. */
export const DEFAULT_BOOKING_TIMEZONE = "Australia/Sydney";

function getTimeZoneOffsetMs(timeZone: string, utcDate: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(utcDate);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const hour = get("hour") === 24 ? 0 : get("hour");
  const asUtcMs = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hour,
    get("minute"),
    get("second"),
  );
  return asUtcMs - utcDate.getTime();
}

function toDatetimeLocalInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Tenant wall-clock value for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(
  date = new Date(),
  timeZone = DEFAULT_BOOKING_TIMEZONE,
): string {
  return toDatetimeLocalInZone(date, timeZone);
}

/**
 * Interpret a datetime-local string as wall-clock time in `timeZone`
 * and return UTC ISO (handles Sydney DST).
 */
export function datetimeLocalToIso(
  value: string,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
): string {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const utcGuess = new Date(
    Date.UTC(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0),
  );
  const offsetMs = getTimeZoneOffsetMs(timeZone, utcGuess);
  const adjusted = new Date(utcGuess.getTime() - offsetMs);
  const offsetMs2 = getTimeZoneOffsetMs(timeZone, adjusted);
  return new Date(utcGuess.getTime() - offsetMs2).toISOString();
}

export function isoToDatetimeLocal(
  iso: string,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
): string {
  return toDatetimeLocalInZone(new Date(iso), timeZone);
}

/** Clear date + 24h time label in tenant timezone, e.g. "4 Jul 2026, 14:00". */
export function formatShiftDateTime(
  iso: string,
  timeZone = DEFAULT_BOOKING_TIMEZONE,
): string {
  return new Date(iso).toLocaleString("en-AU", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatTimezoneLabel(timeZone: string): string {
  const city = timeZone.split("/").pop()?.replaceAll("_", " ") ?? timeZone;
  try {
    const parts = new Intl.DateTimeFormat("en-AU", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const zoneName =
      parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone;
    return `${city} (${zoneName})`;
  } catch {
    return city;
  }
}

export const DEFAULT_SHIFT_DURATION_HOURS = 12;

export function addHoursToDatetimeLocal(
  value: string,
  hours: number,
  timeZone: string,
): string {
  const iso = datetimeLocalToIso(value, timeZone);
  return isoToDatetimeLocal(
    new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString(),
    timeZone,
  );
}

export function addMinutesToDatetimeLocal(
  value: string,
  minutes: number,
  timeZone: string,
): string {
  const iso = datetimeLocalToIso(value, timeZone);
  return isoToDatetimeLocal(
    new Date(new Date(iso).getTime() + minutes * 60_000).toISOString(),
    timeZone,
  );
}

/** Ensure shift start is not in the past and end is after start (+12h default). */
export function normalizeShiftWindow(
  shiftStartsAt: string,
  shiftEndsAt: string,
  localNow: string,
  timeZone: string,
): { shiftStartsAt: string; shiftEndsAt: string } {
  const start =
    !shiftStartsAt || shiftStartsAt < localNow ? localNow : shiftStartsAt;
  const end =
    !shiftEndsAt || shiftEndsAt <= start
      ? addHoursToDatetimeLocal(start, DEFAULT_SHIFT_DURATION_HOURS, timeZone)
      : shiftEndsAt;

  return { shiftStartsAt: start, shiftEndsAt: end };
}

export function defaultShiftWindow(
  now = new Date(),
  timeZone = DEFAULT_BOOKING_TIMEZONE,
): {
  shiftStartsAt: string;
  shiftEndsAt: string;
} {
  const shiftStartsAt = toDatetimeLocalValue(now, timeZone);
  const shiftEndsAt = addHoursToDatetimeLocal(
    shiftStartsAt,
    DEFAULT_SHIFT_DURATION_HOURS,
    timeZone,
  );

  return { shiftStartsAt, shiftEndsAt };
}

export interface ShiftSlotOption {
  startsAt: string;
  label: string;
}

/** Open start times inside a shift window (overnight-safe). */
export function getSlotsInShiftWindow(
  shiftStartsAtIso: string,
  shiftEndsAtIso: string,
  durationMinutes: number,
  bookings: { startsAt: string; endsAt: string }[],
  options?: { now?: Date; stepMinutes?: number; timeZone?: string },
): ShiftSlotOption[] {
  const shiftStart = new Date(shiftStartsAtIso).getTime();
  const shiftEnd = new Date(shiftEndsAtIso).getTime();
  if (
    Number.isNaN(shiftStart) ||
    Number.isNaN(shiftEnd) ||
    shiftEnd <= shiftStart
  ) {
    return [];
  }

  const durationMs = durationMinutes * 60_000;
  const stepMs = (options?.stepMinutes ?? 30) * 60_000;
  const now = options?.now ?? new Date();
  const timeZone = options?.timeZone ?? DEFAULT_BOOKING_TIMEZONE;
  const earliest = now.getTime() + 5 * 60_000;
  const slots: ShiftSlotOption[] = [];

  for (let start = shiftStart; start + durationMs <= shiftEnd; start += stepMs) {
    if (start < earliest) continue;

    const end = start + durationMs;
    const overlaps = bookings.some((booking) => {
      const bookingStart = new Date(booking.startsAt).getTime();
      const bookingEnd = new Date(booking.endsAt).getTime();
      return start < bookingEnd && end > bookingStart;
    });

    if (!overlaps) {
      const startsAt = new Date(start).toISOString();
      slots.push({
        startsAt,
        label: formatShiftDateTime(startsAt, timeZone),
      });
    }
  }

  return slots;
}

const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function dayCodeForDate(date: Date): string {
  return DAY_CODES[date.getDay()] ?? "sun";
}

export function isWorkingToday(workingDays: string[], date = new Date()): boolean {
  if (!workingDays?.length) return true;
  return workingDays.includes(dayCodeForDate(date));
}

/** Next calendar day (YYYY-MM-DD) that falls on a working day, within `withinDays`. */
export function nextWorkingDateInputValue(
  workingDays: string[],
  fromDate = new Date(),
  withinDays = 21,
): string {
  const days =
    workingDays?.length > 0 ? workingDays : [...DAY_CODES];

  for (let offset = 0; offset < withinDays; offset += 1) {
    const candidate = new Date(fromDate);
    candidate.setHours(12, 0, 0, 0);
    candidate.setDate(candidate.getDate() + offset);
    if (days.includes(dayCodeForDate(candidate))) {
      return todayDateInputValue(candidate);
    }
  }

  return todayDateInputValue(fromDate);
}

export function roundToSlotMinutes(minutes: number): number {
  return Math.round(minutes / SLOT_STEP_MINUTES) * SLOT_STEP_MINUTES;
}

function parseTimeOnDate(date: string, time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value.getTime();
}

function formatTimeValue(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function generateTimeSlotOptions(
  workingHoursStart: string,
  workingHoursEnd: string,
  stepMinutes = SLOT_STEP_MINUTES,
): string[] {
  const [startH, startM] = workingHoursStart.split(":").map(Number);
  const [endH, endM] = workingHoursEnd.split(":").map(Number);
  const start = (startH ?? 0) * 60 + (startM ?? 0);
  const end = (endH ?? 0) * 60 + (endM ?? 0);
  const slots: string[] = [];

  for (let minute = start; minute < end; minute += stepMinutes) {
    const hours = String(Math.floor(minute / 60)).padStart(2, "0");
    const mins = String(minute % 60).padStart(2, "0");
    slots.push(`${hours}:${mins}`);
  }

  return slots;
}

/** All HH:MM options in a day (default every 30 minutes). */
export function allDayTimeSlots(stepMinutes = 30): string[] {
  const slots: string[] = [];
  for (let minute = 0; minute < MINUTES_IN_DAY; minute += stepMinutes) {
    const hours = String(Math.floor(minute / 60)).padStart(2, "0");
    const mins = String(minute % 60).padStart(2, "0");
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

export function normalizeTimeSlot(value: string): string | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function sortTimeSlots(slots: string[]): string[] {
  return [...slots].sort((a, b) => a.localeCompare(b));
}

/** Hourly slots between working hours (inclusive start, exclusive end). */
export function hourlySlotsBetween(
  workingHoursStart: string,
  workingHoursEnd: string,
): string[] {
  const start = normalizeTimeSlot(workingHoursStart) ?? "09:00";
  const end = normalizeTimeSlot(workingHoursEnd) ?? "18:00";
  const [startH] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const endMinutes = (endH ?? 0) * 60 + (endM ?? 0);
  const slots: string[] = [];

  for (let hour = startH ?? 9; hour * 60 < endMinutes; hour += 1) {
    slots.push(`${String(hour).padStart(2, "0")}:00`);
  }

  return slots;
}

export function getAvailableStartSlots(
  date: string,
  workingHoursStart: string,
  workingHoursEnd: string,
  bookings: AdminBooking[],
  durationMinutes: number,
  options?: { now?: Date },
): string[] {
  const workStart = parseTimeOnDate(date, workingHoursStart);
  const workEnd = parseTimeOnDate(date, workingHoursEnd);
  const durationMs = durationMinutes * 60_000;
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const slots: string[] = [];
  const now = options?.now ?? new Date();
  const today = todayDateInputValue(now);
  const earliestStart =
    date === today ? now.getTime() + 5 * 60_000 : Number.NEGATIVE_INFINITY;

  for (let start = workStart; start + durationMs <= workEnd; start += stepMs) {
    if (start < earliestStart) continue;

    const end = start + durationMs;
    const overlaps = bookings.some((booking) => {
      const bookingStart = new Date(booking.startsAt).getTime();
      const bookingEnd = new Date(booking.endsAt).getTime();
      return start < bookingEnd && end > bookingStart;
    });

    if (!overlaps) {
      slots.push(formatTimeValue(start));
    }
  }

  return slots;
}

/** Filter admin-configured bookable slots against bookings and past times. */
export function getAvailableBookableSlots(
  date: string,
  bookableSlots: string[],
  bookings: AdminBooking[],
  durationMinutes: number,
  options?: { now?: Date },
): string[] {
  const durationMs = durationMinutes * 60_000;
  const now = options?.now ?? new Date();
  const today = todayDateInputValue(now);
  const earliestStart =
    date === today ? now.getTime() + 5 * 60_000 : Number.NEGATIVE_INFINITY;

  const normalized = sortTimeSlots(
    bookableSlots
      .map((slot) => normalizeTimeSlot(slot))
      .filter((slot): slot is string => Boolean(slot)),
  );

  return normalized.filter((slot) => {
    const start = parseTimeOnDate(date, slot);
    if (start < earliestStart) return false;

    const end = start + durationMs;
    return !bookings.some((booking) => {
      const bookingStart = new Date(booking.startsAt).getTime();
      const bookingEnd = new Date(booking.endsAt).getTime();
      return start < bookingEnd && end > bookingStart;
    });
  });
}

export function buildStartsAtIso(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value.toISOString();
}

export { MINUTES_IN_DAY, SLOT_STEP_MINUTES };
