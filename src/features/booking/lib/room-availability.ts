import { formatAmPmTime } from "./schedule-utils";

export interface RoomSlotBooking {
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

export function getRoomAvailabilityAtTime(
  rooms: RoomOption[],
  startsAtIso: string,
  durationMinutes: number,
  bookings: RoomSlotBooking[],
): RoomAvailabilityStatus[] {
  const startMs = new Date(startsAtIso).getTime();
  const endMs = startMs + durationMinutes * 60_000;

  return rooms.map((room) => {
    const conflict = bookings.find(
      (booking) =>
        booking.roomId === room.id &&
        isActiveRoomBooking(booking) &&
        timeRangesOverlap(startMs, endMs, booking.startsAt, booking.endsAt),
    );

    return {
      id: room.id,
      name: room.name,
      available: !conflict,
      conflictLabel: conflict
        ? `${formatAmPmTime(conflict.startsAt)}–${formatAmPmTime(conflict.endsAt)}`
        : undefined,
    };
  });
}

export function toRoomSlotBookings(
  bookings: {
    roomId: string | null;
    startsAt: string;
    endsAt: string;
    status?: string;
  }[],
): RoomSlotBooking[] {
  return bookings
    .filter((booking) => booking.roomId && isActiveRoomBooking(booking))
    .map((booking) => ({
      roomId: booking.roomId,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
    }));
}
