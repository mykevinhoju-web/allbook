/**
 * Run: npx tsx scripts/verify-revenue-report.ts
 */
import assert from "node:assert/strict";

import {
  aggregateRevenueReport,
  inclusiveDaySpan,
  isValidReportDate,
  reportDateRangeToUtc,
} from "../src/features/admin/lib/revenue-report";

assert.equal(isValidReportDate("2026-07-08"), true);
assert.equal(isValidReportDate("2026-13-01"), false);
assert.equal(inclusiveDaySpan("2026-07-01", "2026-07-03"), 3);

const range = reportDateRangeToUtc(
  "2026-07-08",
  "2026-07-08",
  "Australia/Sydney",
);
assert.ok(range.rangeStart < range.rangeEnd);

const report = aggregateRevenueReport(
  [
    {
      id: "b1",
      staffId: "s1",
      staffName: "Amy",
      startsAt: "2026-07-07T23:30:00.000Z", // 09:30 Sydney on Jul 8
      priceCents: 10000,
      status: "confirmed",
      customerName: "Jane",
      cashCents: 10000,
      cardCents: 0,
      staffPayoutCents: 4000,
    },
    {
      id: "b2",
      staffId: "s1",
      staffName: "Amy",
      startsAt: "2026-07-08T04:00:00.000Z",
      priceCents: 5000,
      status: "confirmed",
      customerName: null,
      cashCents: 2000,
      cardCents: 3000,
      staffPayoutCents: 2000,
    },
    {
      id: "b3",
      staffId: "s2",
      staffName: "Ben",
      startsAt: "2026-07-09T01:00:00.000Z", // Jul 9 Sydney
      priceCents: 8000,
      status: "completed",
      customerName: "Sam",
      cashCents: 0,
      cardCents: 8000,
      staffPayoutCents: 3000,
    },
  ],
  "Australia/Sydney",
);

assert.equal(report.grandTotalCents, 23000);
assert.equal(report.staffPayoutTotalCents, 9000);
assert.equal(report.shopTotalCents, 14000);
assert.equal(report.cashTotalCents, 12000);
assert.equal(report.cardTotalCents, 11000);
assert.equal(report.bookingCount, 3);
assert.equal(report.byStaff.length, 2);
assert.equal(report.byStaff[0]?.staffName, "Amy");
assert.equal(report.byStaff[0]?.totalCents, 15000);
assert.equal(report.byStaff[0]?.staffPayoutCents, 6000);
assert.equal(report.byStaff[0]?.shopCents, 9000);
assert.equal(report.byStaff[0]?.cashCents, 12000);
assert.equal(report.byStaff[0]?.cardCents, 3000);
assert.equal(report.byStaff[0]?.daily.length, 1);
assert.equal(report.byStaff[0]?.daily[0]?.date, "2026-07-08");
assert.equal(report.byStaff[0]?.daily[0]?.bookings.length, 2);
assert.equal(report.byStaff[0]?.daily[0]?.bookings[0]?.customerName, "Jane");
assert.equal(report.byStaff[0]?.daily[0]?.bookings[1]?.customerName, null);
assert.equal(report.byStaff[1]?.staffName, "Ben");
assert.equal(report.dailyTotals.length, 2);
assert.equal(report.dailyTotals[0]?.totalCents, 15000);
assert.equal(report.dailyTotals[1]?.totalCents, 8000);

console.log("Revenue report verification passed.");
