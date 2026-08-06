/**
 * Run: npx tsx scripts/verify-dashboard-stats.ts
 */
import assert from "node:assert/strict";

import {
  buildDashboardStats,
  dashboardQueryRange,
} from "../src/features/admin/lib/dashboard-stats";

const timeZone = "Australia/Sydney";
const today = "2026-07-09";
const yesterday = "2026-07-08";

const stats = buildDashboardStats({
  today,
  yesterday,
  timeZone,
  bookings: [
    {
      id: "b1",
      staffId: "s1",
      staffName: "Amy",
      startsAt: "2026-07-08T04:00:00.000Z",
      priceCents: 6000,
    },
    {
      id: "b2",
      staffId: "s1",
      staffName: "Amy",
      startsAt: "2026-07-09T01:00:00.000Z",
      priceCents: 5000,
    },
    {
      id: "b3",
      staffId: "s2",
      staffName: "Ben",
      startsAt: "2026-07-09T02:00:00.000Z",
      priceCents: 7000,
    },
  ],
  staff: [
    {
      id: "s1",
      name: "Amy",
      status: "active",
      attributes: { shiftPlan: { "2026-07-09": { startTime: "09:00", endTime: "21:00" } } },
    },
    {
      id: "s2",
      name: "Ben",
      status: "active",
      attributes: { daySchedule: { "2026-07-09": false } },
    },
  ],
});

assert.equal(stats.todayBookingCount, 2);
assert.equal(stats.yesterdayBookingCount, 1);
assert.equal(stats.yesterdayRevenueCents, 6000);
assert.equal(stats.staffWorkingToday.length, 1);
assert.equal(stats.staffWorkingToday[0]?.name, "Amy");
assert.equal(stats.bookingsByStaff.length, 2);
assert.equal(stats.bookingsByStaff[0]?.staffName, "Amy");
assert.equal(stats.bookingsByStaff[0]?.bookingCount, 1);

const range = dashboardQueryRange(today, yesterday, timeZone);
assert.ok(range.rangeStart < range.rangeEnd);

console.log("Dashboard stats verification passed.");
