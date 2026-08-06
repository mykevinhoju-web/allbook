import assert from "node:assert/strict";

import {
  durationHoursForEntry,
  entryFromStartAndDurationHours,
  roundUpClockToHalfHour,
} from "../src/features/staff/utils/shift-calendar";
import { isOvernightShift } from "../src/features/staff/utils/shift-plan";

const day = entryFromStartAndDurationHours("13:00", 8);
assert.equal(day.startTime, "13:00");
assert.equal(day.endTime, "21:00");
assert.equal(isOvernightShift(day), false);
assert.equal(durationHoursForEntry(day), 8);

const overnight12 = entryFromStartAndDurationHours("13:00", 12);
assert.equal(overnight12.endTime, "01:00");
assert.equal(isOvernightShift(overnight12), true);
assert.equal(durationHoursForEntry(overnight12), 12);

const overnight24 = entryFromStartAndDurationHours("13:00", 24);
assert.equal(overnight24.startTime, "13:00");
assert.equal(overnight24.endTime, "13:00");
assert.equal(isOvernightShift(overnight24), true);
assert.equal(durationHoursForEntry(overnight24), 24);

assert.equal(roundUpClockToHalfHour("13:01"), "13:30");
assert.equal(roundUpClockToHalfHour("13:00"), "13:00");
assert.equal(roundUpClockToHalfHour("13:31"), "14:00");

console.log("verify-shift-quick-duration: ok");
