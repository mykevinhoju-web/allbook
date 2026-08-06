import {
  ACTIVE_BOOKING_STATUSES,
  SLOT_INTERVAL_MINUTES,
  addMinutes,
  formatMinutesToTime,
  isDateInLeaveRange,
  mergeRanges,
  parseTimeToMinutes,
  subtractBusyFromWindow,
} from "./time-utils";
import type {
  ExistingBookingBlock,
  GenerateTimeSlotsInput,
  TimeSlot,
} from "./types";

function isBlockingBooking(booking: ExistingBookingBlock): boolean {
  if (!booking.status) return true;
  return (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(booking.status);
}

/**
 * Generate bookable start times for one staff + service + date.
 *
 * Rules:
 * - Intersection of business hours ∩ staff hours
 * - Subtract staff breaks
 * - Subtract leave (whole day)
 * - Subtract existing bookings + buffer
 * - Slot must fit full service duration inside a free window
 * - Candidates step by interval (default 15), starting at each free window start
 */
export function generateTimeSlots(input: GenerateTimeSlotsInput): TimeSlot[] {
  const interval = input.intervalMinutes ?? SLOT_INTERVAL_MINUTES;
  const duration = input.serviceDurationMinutes;
  const defaultBuffer = input.bufferMinutes;

  if (duration <= 0) return [];
  if (interval <= 0) return [];

  if (input.staffLeaves.some((leave) => isDateInLeaveRange(input.date, leave))) {
    return [];
  }

  if (input.businessHours.closed || input.staffHours.isDayOff) {
    return [];
  }

  const businessStart = parseTimeToMinutes(input.businessHours.open);
  const businessEnd = parseTimeToMinutes(input.businessHours.close);
  const staffStart = parseTimeToMinutes(input.staffHours.startTime);
  const staffEnd = parseTimeToMinutes(input.staffHours.endTime);

  const windowStart = Math.max(businessStart, staffStart);
  const windowEnd = Math.min(businessEnd, staffEnd);
  if (windowEnd <= windowStart) return [];

  const busy = mergeRanges([
    ...input.staffBreaks.map((b) => ({
      start: parseTimeToMinutes(b.startTime),
      end: parseTimeToMinutes(b.endTime),
    })),
    ...input.existingBookings.filter(isBlockingBooking).map((b) => {
      const start = parseTimeToMinutes(b.startTime);
      const end = parseTimeToMinutes(b.endTime);
      const buffer = b.bufferMinutes ?? defaultBuffer;
      return { start, end: end + buffer };
    }),
  ]);

  const freeWindows = subtractBusyFromWindow(windowStart, windowEnd, busy);
  const starts = new Set<number>();

  for (const free of freeWindows) {
    if (free.start + duration <= free.end) {
      starts.add(free.start);
    }

    let aligned = free.start;
    const rem = free.start % interval;
    if (rem !== 0) aligned = free.start + (interval - rem);

    for (let start = aligned; start + duration <= free.end; start += interval) {
      starts.add(start);
    }
  }

  return [...starts]
    .sort((a, b) => a - b)
    .map((start) => ({
      startTime: formatMinutesToTime(start),
      endTime: formatMinutesToTime(start + duration),
      available: true,
    }));
}

/** Convenience: end time for a chosen start. */
export function getSlotEndTime(
  startTime: string,
  durationMinutes: number,
): string {
  return addMinutes(startTime, durationMinutes);
}
