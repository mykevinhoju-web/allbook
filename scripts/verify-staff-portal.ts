import assert from "node:assert/strict";
import { hash } from "bcryptjs";

import {
  canCheckInToBooking,
  isBookingCheckedIn,
} from "../src/features/booking/lib/booking-check-in";
import {
  findStaffAccountsByPin,
  internalStaffLoginId,
} from "../src/lib/staff-pin-auth";
import { validateStaffPin } from "../src/lib/staff-pin";

assert.equal(validateStaffPin("1234"), null);
assert.ok(validateStaffPin("12"));
assert.ok(validateStaffPin("abcd"));

assert.equal(
  internalStaffLoginId("550e8400-e29b-41d4-a716-446655440000"),
  "550e8400e29b41d4a716446655440000",
);

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

void (async () => {
  const staffA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const staffB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const pinHash = await hash("4321", 10);

  const matches = await findStaffAccountsByPin(
    {
      from: () => ({
        select: () => ({
          eq: async () => ({
            data: [
              {
                staff_id: staffA,
                login_id: internalStaffLoginId(staffA),
                password_hash: pinHash,
              },
              {
                staff_id: staffB,
                login_id: internalStaffLoginId(staffB),
                password_hash: await hash("9999", 10),
              },
            ],
            error: null,
          }),
        }),
      }),
    } as never,
    "tenant-1",
    "4321",
  );

  assert.equal(matches.length, 1);
  assert.equal(matches[0]?.staff_id, staffA);

  console.log("verify-staff-portal: ok");
})();
