import type { AdminBooking } from "../types/admin-booking";

export type RoomBookingTiming = {
  startsAt: string;
  endsAt: string;
  checkedOutAt?: string | null;
  status?: string;
};

/** When the booking stops occupying a room (checkout or scheduled end). */
export function getRoomOccupancyEndMs(booking: RoomBookingTiming): number {
  if (booking.checkedOutAt) {
    return new Date(booking.checkedOutAt).getTime();
  }

  if (
    booking.status === "completed" ||
    booking.status === "cancelled"
  ) {
    return new Date(booking.startsAt).getTime();
  }

  return new Date(booking.endsAt).getTime();
}

export function isBookingOccupyingRoom(
  booking: RoomBookingTiming,
  at: Date = new Date(),
): boolean {
  if (booking.status === "cancelled") {
    return false;
  }

  const atMs = at.getTime();
  const startMs = new Date(booking.startsAt).getTime();
  const endMs = getRoomOccupancyEndMs(booking);

  return startMs <= atMs && atMs < endMs;
}

export function isBookingUpcoming(
  booking: RoomBookingTiming,
  at: Date = new Date(),
): boolean {
  if (booking.status === "cancelled" || booking.status === "completed") {
    return false;
  }

  return new Date(booking.startsAt).getTime() > at.getTime();
}

/** Bookings that still block a room slot (current or future). */
export function filterActiveRoomBookings<T extends RoomBookingTiming>(
  bookings: T[],
  at: Date = new Date(),
): T[] {
  const atMs = at.getTime();

  return bookings.filter((booking) => {
    if (booking.status === "cancelled") {
      return false;
    }

    return getRoomOccupancyEndMs(booking) > atMs;
  });
}

export function overlapsRoomSlot(
  booking: RoomBookingTiming,
  slotStartMs: number,
  slotEndMs: number,
): boolean {
  if (booking.status === "cancelled") {
    return false;
  }

  const bookingStart = new Date(booking.startsAt).getTime();
  const bookingEnd = getRoomOccupancyEndMs(booking);

  return slotStartMs < bookingEnd && slotEndMs > bookingStart;
}

export function getCurrentRoomBooking<T extends AdminBooking>(
  bookings: T[],
  at: Date = new Date(),
): T | null {
  return (
    bookings.find((booking) => isBookingOccupyingRoom(booking, at)) ?? null
  );
}
