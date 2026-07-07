/**
 * Run: npx tsx scripts/verify-overnight-shift.ts
 */
import assert from "node:assert/strict";

import {
  formatShiftPlanDayLabel,
  isDateCoveredByShiftPlan,
  isOvernightShift,
  resolveShiftForCalendarDate,
  spilloverAnchorForDate,
  tailDatesForPlan,
} from "../src/features/staff/utils/shift-plan";

const TZ = "Australia/Sydney";
const plan = {
  "2026-03-22": { startTime: "21:00", endTime: "09:00" },
};

assert.equal(isOvernightShift(plan["2026-03-22"]), true);
assert.equal(formatShiftPlanDayLabel("2026-03-22", plan), "21→9");
assert.equal(formatShiftPlanDayLabel("2026-03-23", plan), "→9");
assert.equal(spilloverAnchorForDate(plan, "2026-03-23"), "2026-03-22");
assert.deepEqual(tailDatesForPlan(plan), ["2026-03-23"]);

const anchor = resolveShiftForCalendarDate(plan, "2026-03-22", TZ);
assert.ok(anchor);
assert.equal(anchor?.isOvernight, true);
assert.equal(anchor?.isTailOnly, false);
assert.ok(anchor!.shiftStartsAt.includes("T"));
assert.ok(new Date(anchor!.shiftEndsAt) > new Date(anchor!.shiftStartsAt));

const tail = resolveShiftForCalendarDate(plan, "2026-03-23", TZ);
assert.ok(tail);
assert.equal(tail?.isTailOnly, true);
assert.equal(tail?.anchorDate, "2026-03-22");
assert.ok(tail!.viewStartsAt.endsWith("Z") || tail!.viewStartsAt.includes("+"));

assert.equal(isDateCoveredByShiftPlan(plan, "2026-03-22", TZ), true);
assert.equal(isDateCoveredByShiftPlan(plan, "2026-03-23", TZ), true);
assert.equal(isDateCoveredByShiftPlan(plan, "2026-03-24", TZ), false);

console.log("Overnight shift verification passed.");
