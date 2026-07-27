import assert from "node:assert/strict";

import {
  availableHours,
  availableMinutes,
  availablePeriods,
  buildBookableDateOptions,
  buildSlotClocks,
  findSlotIso,
  uniqueMonths,
} from "../src/features/booking/lib/customer-datetime-picker-utils";

const timeZone = "Australia/Sydney";
const date = "2026-07-27";

const slots = [
  { value: "2026-07-27T01:00:00+10:00", label: "1:00 AM" },
  { value: "2026-07-27T01:10:00+10:00", label: "1:10 AM" },
  { value: "2026-07-27T13:30:00+10:00", label: "1:30 PM" },
  { value: "2026-07-27T14:00:00+10:00", label: "2:00 PM" },
];

const clocks = buildSlotClocks(slots, date, timeZone);
assert.deepEqual(availablePeriods(clocks), ["AM", "PM"]);
assert.deepEqual(availableHours(clocks, "AM"), [1]);
assert.deepEqual(availableHours(clocks, "PM"), [1, 2]);
assert.deepEqual(availableMinutes(clocks, "AM", 1), [0, 10]);
assert.deepEqual(availableMinutes(clocks, "PM", 1), [30]);

const iso = findSlotIso(clocks, "PM", 2, 0);
assert.equal(iso, "2026-07-27T14:00:00+10:00");

const dates = buildBookableDateOptions("2026-07-27", 13);
assert.equal(dates.length, 14);
assert.equal(dates[0]?.value, "2026-07-27");
assert.ok(uniqueMonths(dates).length >= 1);

console.log("verify-customer-datetime-picker: ok");
