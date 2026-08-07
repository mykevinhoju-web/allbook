import { checkAvailability } from "./checkAvailability";
import { getSlotEndTime } from "./generateTimeSlots";
import type { CreateBookingInput, SalonBooking } from "./types";
import type { SalonBookingsRepository } from "./repositories/types";

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingValidationError";
  }
}

function validateCustomer(input: CreateBookingInput) {
  if (!input.customerName.trim()) {
    throw new BookingValidationError("Customer name is required.");
  }
  if (!input.salonId || !input.staffId || !input.serviceId) {
    throw new BookingValidationError("Salon, staff, and service are required.");
  }
  if (input.duration <= 0) {
    throw new BookingValidationError("Service duration must be positive.");
  }
}

/**
 * Create a booking after re-checking availability (never overlaps).
 */
export async function createBooking(
  repository: SalonBookingsRepository,
  input: CreateBookingInput,
): Promise<SalonBooking> {
  validateCustomer(input);

  const availability = checkAvailability({
    ...input.availability,
    date: input.bookingDate,
    startTime: input.startTime,
    serviceDurationMinutes:
      input.availability.serviceDurationMinutes ?? input.duration,
    bufferMinutes: input.availability.bufferMinutes ?? input.bufferMinutes,
  });

  if (!availability.available) {
    throw new BookingConflictError(
      availability.reason ?? "Selected time is no longer available.",
    );
  }

  const endTime =
    availability.endTime ?? getSlotEndTime(input.startTime, input.duration);

  // Double-check against live repository bookings for this staff/date.
  const existing = await repository.listStaffBookingsForDate({
    salonId: input.salonId,
    staffId: input.staffId,
    bookingDate: input.bookingDate,
  });

  const liveCheck = checkAvailability({
    ...input.availability,
    date: input.bookingDate,
    startTime: input.startTime,
    serviceDurationMinutes: input.duration,
    bufferMinutes: input.bufferMinutes,
    existingBookings: existing.map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      bufferMinutes: b.bufferMinutes,
      status: b.status,
    })),
  });

  if (!liveCheck.available) {
    throw new BookingConflictError(
      liveCheck.reason ?? "Selected time conflicts with another booking.",
    );
  }

  if (!input.policyAccepted) {
    throw new BookingValidationError(
      "You must accept the booking policies to continue.",
    );
  }

  return repository.create({
    salonId: input.salonId,
    staffId: input.staffId,
    serviceId: input.serviceId,
    bookingDate: input.bookingDate,
    startTime: input.startTime,
    endTime,
    duration: input.duration,
    bufferMinutes: input.bufferMinutes,
    status: input.status ?? "pending",
    notes: input.notes ?? null,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail?.trim() ?? "",
    customerPhone: input.customerPhone?.trim() ?? "",
    customerId: null,
    policySnapshot: input.policySnapshot ?? null,
    policyAcceptedAt:
      input.policyAcceptedAt ?? new Date().toISOString(),
  });
}
