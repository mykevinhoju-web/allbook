import assert from "node:assert/strict";

import {
  canCheckInToBooking,
  computeCheckInServiceWindow,
  getActiveCheckedInBooking,
  isBookingCheckedIn,
} from "../src/features/booking/lib/booking-check-in";
import { validateStaffPin } from "../src/lib/staff-pin";
import {
  signRoomSession,
  verifyRoomSession,
} from "../src/lib/room-session";

assert.equal(validateStaffPin("1234"), null);

const futureStart = new Date(Date.now() + 30 * 60_000).toISOString();
const futureEnd = new Date(Date.now() + 90 * 60_000).toISOString();

assert.equal(
  canCheckInToBooking({
    startsAt: futureStart,
    endsAt: futureEnd,
    checkedInAt: null,
    checkedOutAt: null,
    status: "confirmed",
  }),
  true,
);

const checkInAt = new Date("2026-07-25T05:20:00.000Z");
const fullWindow = computeCheckInServiceWindow(checkInAt, 60, []);
assert.equal(fullWindow.ok, true);
if (fullWindow.ok) {
  assert.equal(fullWindow.startsAt, "2026-07-25T05:20:00.000Z");
  assert.equal(fullWindow.endsAt, "2026-07-25T06:20:00.000Z");
  assert.equal(fullWindow.wasCapped, false);
}

const cappedWindow = computeCheckInServiceWindow(checkInAt, 60, [
  "2026-07-25T06:00:00.000Z",
]);
assert.equal(cappedWindow.ok, true);
if (cappedWindow.ok) {
  assert.equal(cappedWindow.endsAt, "2026-07-25T06:00:00.000Z");
  assert.equal(cappedWindow.wasCapped, true);
}

const blockedWindow = computeCheckInServiceWindow(checkInAt, 60, [
  "2026-07-25T05:20:30.000Z",
]);
assert.equal(blockedWindow.ok, false);

const active = getActiveCheckedInBooking([
  {
    id: "b1",
    staffId: "s1",
    staffName: "A",
    roomId: "r1",
    roomName: "Room 1",
    startsAt: futureStart,
    endsAt: futureEnd,
    durationMinutes: 60,
    priceCents: 0,
    status: "confirmed",
    checkedOutAt: null,
    checkedInAt: new Date().toISOString(),
    customerName: "Guest",
    customerPhone: null,
    customerPostcode: null,
    customerEmail: null,
    notes: null,
  },
]);
assert.ok(active);
assert.equal(isBookingCheckedIn(active!), true);

void (async () => {
  if (!process.env.APP_SESSION_SECRET && !process.env.STAFF_SESSION_SECRET) {
    process.env.APP_SESSION_SECRET = "verify-room-portal-test-secret";
  }

  const token = await signRoomSession({
    role: "room",
    tenantSlug: "dayspa",
    tenantId: "tenant-1",
    roomId: "room-1",
    roomName: "Room 1",
    deviceId: "device-abc",
  });

  const session = await verifyRoomSession(token);
  assert.ok(session);
  assert.equal(session?.role, "room");
  assert.equal(session?.roomId, "room-1");
  assert.equal(session?.deviceId, "device-abc");

  const bad = await verifyRoomSession("not-a-token");
  assert.equal(bad, null);

  console.log("verify-room-portal: ok");
})();
