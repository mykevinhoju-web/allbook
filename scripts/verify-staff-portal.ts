import assert from "node:assert/strict";

import {
  canCheckInToBooking,
  isBookingCheckedIn,
} from "../src/features/booking/lib/booking-check-in";
import { validateStaffPin } from "../src/lib/staff-pin";

assert.equal(validateStaffPin("1234"), null);
assert.ok(validateStaffPin("12"));
assert.ok(validateStaffPin("abcd"));

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

assert.equal(
  isBookingCheckedIn({
    checkedInAt: new Date().toISOString(),
    checkedOutAt: null,
    status: "confirmed",
  }),
  true,
);

console.log("verify-staff-portal: ok");
