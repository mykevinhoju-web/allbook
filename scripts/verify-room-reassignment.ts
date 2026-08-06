/**
 * Run: npx tsx scripts/verify-room-reassignment.ts
 */
import assert from "node:assert/strict";

import {
  getBookingRoomChangeWindow,
  getRoomAvailabilityInWindow,
} from "../src/features/booking/lib/room-availability";

const rooms = [
  { id: "r1", name: "Room 1" },
  { id: "r2", name: "Room 2" },
  { id: "r3", name: "Room 3" },
];

// Booking A occupies Room 2 for the first half only.
const dayBookings = [
  {
    id: "other",
    roomId: "r2",
    startsAt: "2026-07-08T02:00:00.000Z",
    endsAt: "2026-07-08T03:00:00.000Z",
    status: "confirmed",
  },
];

const bookingStarts = "2026-07-08T02:00:00.000Z";
const bookingEnds = "2026-07-08T04:00:00.000Z";

// Upcoming: full window — Room 2 busy for entire booking start overlap
{
  const at = new Date("2026-07-08T01:00:00.000Z");
  const window = getBookingRoomChangeWindow(bookingStarts, bookingEnds, at);
  assert.ok(window);
  assert.equal(window!.remainingOnly, false);
  assert.equal(window!.startsAt, bookingStarts);

  const statuses = getRoomAvailabilityInWindow(
    rooms,
    window!.startsAt,
    window!.endsAt,
    dayBookings,
    { excludeBookingId: "self", currentRoomId: "r1" },
  );

  assert.equal(statuses.find((r) => r.id === "r1")?.available, true);
  assert.equal(statuses.find((r) => r.id === "r2")?.available, false);
  assert.equal(statuses.find((r) => r.id === "r3")?.available, true);
}

// In progress after Room 2 frees: remaining window allows move to Room 2
{
  const at = new Date("2026-07-08T03:15:00.000Z");
  const window = getBookingRoomChangeWindow(bookingStarts, bookingEnds, at);
  assert.ok(window);
  assert.equal(window!.remainingOnly, true);
  assert.equal(window!.startsAt, at.toISOString());

  const statuses = getRoomAvailabilityInWindow(
    rooms,
    window!.startsAt,
    window!.endsAt,
    dayBookings,
    { excludeBookingId: "self", currentRoomId: "r1" },
  );

  assert.equal(statuses.find((r) => r.id === "r2")?.available, true);
  assert.equal(statuses.find((r) => r.id === "r3")?.available, true);
}

// Ended booking: no window
{
  const at = new Date("2026-07-08T05:00:00.000Z");
  const window = getBookingRoomChangeWindow(bookingStarts, bookingEnds, at);
  assert.equal(window, null);
}

console.log("Room reassignment verification passed.");
