import type { AdminBooking } from "../types/admin-booking";

export function isBookingCheckedIn(
  booking: Pick<AdminBooking, "checkedInAt" | "checkedOutAt" | "status">,
): boolean {
  return (
    Boolean(booking.checkedInAt) &&
    !booking.checkedOutAt &&
    booking.status !== "completed" &&
    booking.status !== "cancelled"
  );
}

export function canCheckInToBooking(
  booking: Pick<
    AdminBooking,
    "startsAt" | "endsAt" | "checkedInAt" | "checkedOutAt" | "status"
  >,
  at: Date = new Date(),
): boolean {
  if (
    booking.checkedInAt ||
    booking.checkedOutAt ||
    booking.status === "completed" ||
    booking.status === "cancelled"
  ) {
    return false;
  }

  const atMs = at.getTime();
  const startMs = new Date(booking.startsAt).getTime();
  const endMs = new Date(booking.endsAt).getTime();
  const earliestMs = startMs - 60 * 60_000;

  return atMs >= earliestMs && atMs < endMs;
}

export function getActiveCheckedInBooking<T extends AdminBooking>(
  bookings: T[],
): T | null {
  return bookings.find((booking) => isBookingCheckedIn(booking)) ?? null;
}
