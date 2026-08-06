import { checkAvailability } from "./checkAvailability";
import { getSlotEndTime } from "./generateTimeSlots";
import {
  BookingConflictError,
  BookingValidationError,
} from "./createBooking";
import type {
  GenerateTimeSlotsInput,
  SalonBooking,
  UpdateBookingInput,
} from "./types";
import type { SalonBookingsRepository } from "./repositories/types";

export type UpdateBookingOptions = {
  /** Context required when rescheduling time/staff/date */
  availability?: GenerateTimeSlotsInput;
};

/**
 * Update booking fields. Reschedules re-run availability checks.
 */
export async function updateBooking(
  repository: SalonBookingsRepository,
  bookingId: string,
  patch: UpdateBookingInput,
  options: UpdateBookingOptions = {},
): Promise<SalonBooking> {
  if (!bookingId) throw new BookingValidationError("Booking id is required.");

  const existing = await repository.getById(bookingId);
  if (!existing) throw new BookingValidationError("Booking not found.");

  const nextDate = patch.bookingDate ?? existing.bookingDate;
  const nextStart = patch.startTime ?? existing.startTime;
  const nextStaff = patch.staffId ?? existing.staffId;
  const nextDuration = patch.duration ?? existing.duration;
  const nextBuffer = patch.bufferMinutes ?? existing.bufferMinutes;
  const nextEnd =
    patch.endTime ??
    (patch.startTime || patch.duration
      ? getSlotEndTime(nextStart, nextDuration)
      : existing.endTime);

  const rescheduling =
    Boolean(patch.bookingDate) ||
    Boolean(patch.startTime) ||
    Boolean(patch.staffId) ||
    Boolean(patch.duration);

  if (rescheduling) {
    if (!options.availability) {
      throw new BookingValidationError(
        "Availability context is required to reschedule.",
      );
    }

    const others = (
      await repository.listStaffBookingsForDate({
        salonId: existing.salonId,
        staffId: nextStaff,
        bookingDate: nextDate,
      })
    ).filter((b) => b.id !== bookingId);

    const check = checkAvailability({
      ...options.availability,
      date: nextDate,
      startTime: nextStart,
      serviceDurationMinutes: nextDuration,
      bufferMinutes: nextBuffer,
      existingBookings: others.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        bufferMinutes: b.bufferMinutes,
        status: b.status,
      })),
    });

    if (!check.available) {
      throw new BookingConflictError(
        check.reason ?? "Updated time is not available.",
      );
    }
  }

  return repository.update(bookingId, {
    ...patch,
    endTime: nextEnd,
  });
}
