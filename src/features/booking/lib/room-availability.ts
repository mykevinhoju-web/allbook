import { formatAmPmTime } from "./schedule-utils";

export interface RoomSlotBooking {
  id?: string;
  roomId: string | null;
  startsAt: string;
  endsAt: string;
  status?: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface RoomAvailabilityStatus {
  id: string;
  name: string;
  available: boolean;
  conflictLabel?: string;
}

export function isActiveRoomBooking(booking: { status?: string }): boolean {
  return booking.status !== "cancelled" && booking.status !== "completed";
}

export function timeRangesOverlap(
  startMs: number,
  endMs: number,
  rangeStartsAt: string,
  rangeEndsAt: string,
): boolean {
  const rangeStart = new Date(rangeStartsAt).getTime();
  const rangeEnd = new Date(rangeEndsAt).getTime();
  return startMs < rangeEnd && endMs > rangeStart;
}

export function isRoomBusyInWindow(
  roomId: string,
  startMs: number,
  endMs: number,
  bookings: RoomSlotBooking[],
): boolean {
  return bookings.some(
    (booking) =>
      booking.roomId === roomId &&
      isActiveRoomBooking(booking) &&
      timeRangesOverlap(startMs, endMs, booking.startsAt, booking.endsAt),
  );
}

export function pickFirstAvailableRoom(
  rooms: RoomOption[],
  startMs: number,
  endMs: number,
  bookings: RoomSlotBooking[],
): RoomOption | null {
  return (
    rooms.find((room) => !isRoomBusyInWindow(room.id, startMs, endMs, bookings)) ??
    null
  );
}

export function hasAnyRoomAvailable(
  rooms: RoomOption[],
  startMs: number,
  endMs: number,
  bookings: RoomSlotBooking[],
): boolean {
  return pickFirstAvailableRoom(rooms, startMs, endMs, bookings) !== null;
}

/**
 * Window used when checking whether a booking can move to another room.
 * Upcoming: full [starts, ends). In progress: remaining [now, ends).
 */
export function getBookingRoomChangeWindow(
  startsAtIso: string,
  endsAtIso: string,
  at: Date = new Date(),
): { startsAt: string; endsAt: string; remainingOnly: boolean } | null {
  const startMs = new Date(startsAtIso).getTime();
  const endMs = new Date(endsAtIso).getTime();
  const atMs = at.getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return null;
  }

  if (atMs >= endMs) {
    return null;
  }

  if (atMs <= startMs) {
    return {
      startsAt: startsAtIso,
      endsAt: endsAtIso,
      remainingOnly: false,
    };
  }

  return {
    startsAt: new Date(atMs).toISOString(),
    endsAt: endsAtIso,
    remainingOnly: true,
  };
}

export function getRoomAvailabilityInWindow(
  rooms: RoomOption[],
  windowStartsAtIso: string,
  windowEndsAtIso: string,
  bookings: RoomSlotBooking[],
  options?: {
    excludeBookingId?: string;
    /** Current room — still selectable even if listed as assigned. */
    currentRoomId?: string | null;
  },
): RoomAvailabilityStatus[] {
  const startMs = new Date(windowStartsAtIso).getTime();
  const endMs = new Date(windowEndsAtIso).getTime();

  return rooms.map((room) => {
    const conflict = bookings.find(
      (booking) =>
        booking.roomId === room.id &&
        (!options?.excludeBookingId || booking.id !== options.excludeBookingId) &&
        isActiveRoomBooking(booking) &&
        timeRangesOverlap(startMs, endMs, booking.startsAt, booking.endsAt),
    );

    const isCurrent = options?.currentRoomId === room.id;

    return {
      id: room.id,
      name: room.name,
      available: isCurrent || !conflict,
      conflictLabel:
        !isCurrent && conflict
          ? `${formatAmPmTime(conflict.startsAt)}–${formatAmPmTime(conflict.endsAt)}`
          : undefined,
    };
  });
}

export function getRoomAvailabilityAtTime(
  rooms: RoomOption[],
  startsAtIso: string,
  durationMinutes: number,
  bookings: RoomSlotBooking[],
): RoomAvailabilityStatus[] {
  const startMs = new Date(startsAtIso).getTime();
  const endMs = startMs + durationMinutes * 60_000;

  return getRoomAvailabilityInWindow(
    rooms,
    startsAtIso,
    new Date(endMs).toISOString(),
    bookings,
  );
}

export function toRoomSlotBookings(
  bookings: {
    id?: string;
    roomId: string | null;
    startsAt: string;
    endsAt: string;
    status?: string;
  }[],
): RoomSlotBooking[] {
  return bookings
    .filter((booking) => booking.roomId && isActiveRoomBooking(booking))
    .map((booking) => ({
      id: booking.id,
      roomId: booking.roomId,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
    }));
}
