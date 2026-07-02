import type { AdminBooking } from "../types/admin-booking";

const MINUTES_IN_DAY = 24 * 60;
const SLOT_STEP_MINUTES = 5;

/** Fixed treatment lengths — start times use 5-minute steps. */
export const BOOKING_SERVICE_DURATIONS = [20, 30, 60] as const;
export type BookingServiceDuration = (typeof BOOKING_SERVICE_DURATIONS)[number];

export const BOOKING_DURATION_OPTIONS = BOOKING_SERVICE_DURATIONS;

export function formatServiceDurationLabel(minutes: number): string {
  if (minutes === 60) return "1 hour";
  return `${minutes} min`;
}

export function isValidServiceDuration(
  minutes: number,
): minutes is BookingServiceDuration {
  return (BOOKING_SERVICE_DURATIONS as readonly number[]).includes(minutes);
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
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 || 12;

  return `${period} - ${hour12}:${String(minutes).padStart(2, "0")}`;
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

export function formatBookingSummary(booking: AdminBooking): string {
  return `${formatAmPmTime(booking.startsAt)} ~ ${formatAmPmTime(booking.endsAt)}, ${formatDurationLabel(booking.durationMinutes)}`;
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

export function isWorkingToday(workingDays: string[], date = new Date()): boolean {
  const dayCodes = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return workingDays.includes(dayCodes[date.getDay()] ?? "");
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

export function getAvailableStartSlots(
  date: string,
  workingHoursStart: string,
  workingHoursEnd: string,
  bookings: AdminBooking[],
  durationMinutes: number,
): string[] {
  const workStart = parseTimeOnDate(date, workingHoursStart);
  const workEnd = parseTimeOnDate(date, workingHoursEnd);
  const durationMs = durationMinutes * 60_000;
  const stepMs = SLOT_STEP_MINUTES * 60_000;
  const slots: string[] = [];

  for (let start = workStart; start + durationMs <= workEnd; start += stepMs) {
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

export function buildStartsAtIso(date: string, time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const value = new Date(`${date}T00:00:00`);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value.toISOString();
}

export { MINUTES_IN_DAY, SLOT_STEP_MINUTES };
