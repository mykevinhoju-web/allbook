import type { SalonBooking } from "./types";
import type { SalonBookingsRepository } from "./repositories/types";
import { BookingValidationError } from "./createBooking";

/**
 * Cancel a booking (status → cancelled). Does not delete history.
 */
export async function cancelBooking(
  repository: SalonBookingsRepository,
  bookingId: string,
  options?: { reason?: string },
): Promise<SalonBooking> {
  if (!bookingId) throw new BookingValidationError("Booking id is required.");

  const existing = await repository.getById(bookingId);
  if (!existing) throw new BookingValidationError("Booking not found.");
  if (existing.status === "cancelled") return existing;

  return repository.update(bookingId, {
    status: "cancelled",
    notes: options?.reason
      ? [existing.notes, `Cancelled: ${options.reason}`]
          .filter(Boolean)
          .join("\n")
      : existing.notes,
  });
}
