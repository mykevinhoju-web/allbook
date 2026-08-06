import { generateTimeSlots, getSlotEndTime } from "./generateTimeSlots";
import { parseTimeToMinutes, rangesOverlap } from "./time-utils";
import type {
  CheckAvailabilityInput,
  CheckAvailabilityResult,
} from "./types";

/**
 * Check whether a specific start time is bookable under engine rules.
 */
export function checkAvailability(
  input: CheckAvailabilityInput,
): CheckAvailabilityResult {
  const endTime = getSlotEndTime(
    input.startTime,
    input.serviceDurationMinutes,
  );

  const slots = generateTimeSlots(input);
  const match = slots.find((slot) => slot.startTime === input.startTime);

  if (match?.available) {
    return { available: true, endTime };
  }

  // Provide a precise reason for common failures.
  if (input.businessHours.closed) {
    return { available: false, reason: "Salon is closed on this date." };
  }
  if (input.staffHours.isDayOff) {
    return { available: false, reason: "Staff member is not working this day." };
  }
  if (
    input.staffLeaves.some(
      (leave) =>
        input.date >= leave.startDate && input.date <= leave.endDate,
    )
  ) {
    return { available: false, reason: "Staff member is on leave." };
  }

  const start = parseTimeToMinutes(input.startTime);
  const end = parseTimeToMinutes(endTime);

  for (const brk of input.staffBreaks) {
    const bStart = parseTimeToMinutes(brk.startTime);
    const bEnd = parseTimeToMinutes(brk.endTime);
    if (rangesOverlap(start, end, bStart, bEnd)) {
      return { available: false, reason: "Overlaps a staff break." };
    }
  }

  for (const booking of input.existingBookings) {
    if (booking.status === "cancelled" || booking.status === "no_show") continue;
    const bStart = parseTimeToMinutes(booking.startTime);
    const bEnd =
      parseTimeToMinutes(booking.endTime) +
      (booking.bufferMinutes ?? input.bufferMinutes);
    if (rangesOverlap(start, end, bStart, bEnd)) {
      return {
        available: false,
        reason: "Overlaps an existing booking (including buffer).",
      };
    }
  }

  return {
    available: false,
    reason: match?.reason ?? "Time slot is not available.",
    endTime,
  };
}
