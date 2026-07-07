import assert from "node:assert/strict";

import {
  buildCompactHourGroups,
  findHourKeyForValue,
  formatCompactEndTime,
  minutesForHourGroup,
  slotToIso,
} from "../src/features/booking/lib/compact-time-picker-utils";
import type { BookingTimeSlotOption } from "../src/features/booking/components/schedule/booking-form-sheet";

const timeZone = "Australia/Sydney";
const date = "2026-07-22";

function slot(iso: string): BookingTimeSlotOption {
  return { value: iso, label: iso };
}

const overnightSlots: BookingTimeSlotOption[] = [
  slot("2026-07-22T21:00:00+10:00"),
  slot("2026-07-22T21:30:00+10:00"),
  slot("2026-07-23T01:00:00+10:00"),
  slot("2026-07-23T01:30:00+10:00"),
];

const groups = buildCompactHourGroups(overnightSlots, timeZone, date);
assert.equal(groups.length, 2, "overnight slots split across two hour groups");
assert.equal(groups[0]?.key, "2026-07-22-21", "evening hour key");
assert.equal(groups[1]?.key, "2026-07-23-1", "after-midnight hour key");
assert.ok(
  groups[1]?.hourLabel.includes("23"),
  "after-midnight hour label includes next calendar day",
);

const eveningKey = groups[0]?.key ?? "";
const eveningMinutes = minutesForHourGroup(groups[0], date, timeZone);
assert.equal(eveningMinutes.length, 2, "two evening minute options");
assert.equal(eveningMinutes[0]?.minute, "00");
assert.equal(eveningMinutes[1]?.minute, "30");

const selectedIso = slotToIso(date, overnightSlots[2]!.value);
const hourKey = findHourKeyForValue(
  overnightSlots,
  selectedIso,
  timeZone,
  date,
);
assert.ok(hourKey?.includes("2026-07-23"), "after-midnight hour key uses next date");

const endSameDay = formatCompactEndTime(
  "2026-07-22T21:00:00+10:00",
  60,
  timeZone,
);
assert.ok(endSameDay.length > 0, "same-day end time formatted");

const endNextDay = formatCompactEndTime(
  "2026-07-22T23:30:00+10:00",
  90,
  timeZone,
);
assert.ok(
  endNextDay.includes("23") || endNextDay.includes("Jul"),
  "cross-midnight end includes date context",
);

console.log("verify-compact-time-picker: ok");
