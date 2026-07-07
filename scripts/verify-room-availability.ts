/**
 * Run: npx tsx scripts/verify-room-availability.ts
 */
import assert from "node:assert/strict";

import {
  getRoomAvailabilityAtTime,
  hasAnyRoomAvailable,
  pickFirstAvailableRoom,
} from "../src/features/booking/lib/room-availability";

const rooms = [
  { id: "r1", name: "Room 1" },
  { id: "r2", name: "Room 2" },
];

const bookings = [
  {
    roomId: "r1",
    startsAt: "2026-07-08T03:00:00.000Z",
    endsAt: "2026-07-08T04:00:00.000Z",
    status: "confirmed",
  },
];

const slotStart = new Date("2026-07-08T03:30:00.000Z").getTime();
const slotEnd = slotStart + 30 * 60_000;

assert.equal(isRoomBusy("r1", slotStart, slotEnd), true);
assert.equal(hasAnyRoomAvailable(rooms, slotStart, slotEnd, bookings), true);
assert.equal(
  pickFirstAvailableRoom(rooms, slotStart, slotEnd, bookings)?.id,
  "r2",
);

const statuses = getRoomAvailabilityAtTime(
  rooms,
  "2026-07-08T03:30:00.000Z",
  30,
  bookings,
);
assert.equal(statuses[0]?.available, false);
assert.equal(statuses[1]?.available, true);

console.log("Room availability verification passed.");

function isRoomBusy(
  roomId: string,
  startMs: number,
  endMs: number,
): boolean {
  return !getRoomAvailabilityAtTime(
    rooms,
    new Date(startMs).toISOString(),
    (endMs - startMs) / 60_000,
    bookings,
  ).find((room) => room.id === roomId)?.available;
}
