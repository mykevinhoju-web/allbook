/**
 * Run: npx tsx scripts/verify-room-enter-guard.ts
 *
 * Pure logic checks for Enter rules used by the room tablet UI.
 */
import assert from "node:assert/strict";

import {
  canCheckInToBooking,
  isBookingCheckedIn,
} from "../src/features/booking/lib/booking-check-in";

const now = new Date("2026-07-28T11:20:00.000Z");

const inService = {
  id: "a",
  startsAt: "2026-07-28T11:00:00.000Z",
  endsAt: "2026-07-28T12:00:00.000Z",
  checkedInAt: "2026-07-28T11:00:00.000Z",
  checkedOutAt: null as string | null,
  status: "confirmed",
};

const nextBooking = {
  id: "b",
  startsAt: "2026-07-28T11:30:00.000Z",
  endsAt: "2026-07-28T12:00:00.000Z",
  checkedInAt: null as string | null,
  checkedOutAt: null as string | null,
  status: "confirmed",
};

assert.equal(isBookingCheckedIn(inService), true);
assert.equal(canCheckInToBooking(nextBooking, now), true);

const roomServiceInProgress = [inService, nextBooking].some((booking) =>
  isBookingCheckedIn(booking),
);
const activeBooking = inService;
const canEnter =
  canCheckInToBooking(nextBooking, now) &&
  !activeBooking &&
  !roomServiceInProgress;

assert.equal(roomServiceInProgress, true);
assert.equal(canEnter, false);

const noActiveBooking = null;
const emptyRoomCanEnter =
  canCheckInToBooking(nextBooking, now) &&
  !noActiveBooking &&
  ![nextBooking].some((booking) => isBookingCheckedIn(booking));
assert.equal(emptyRoomCanEnter, true);

console.log("Room enter guard verification passed.");
