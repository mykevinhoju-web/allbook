/**
 * Run: npx tsx scripts/verify-walk-in-rotation.ts
 */
import assert from "node:assert/strict";

import { pickWalkInStaff } from "../src/features/booking/lib/walk-in-rotation";

const rotation = [
  { staffId: "a", sortOrder: 1 },
  { staffId: "b", sortOrder: 2 },
  { staffId: "c", sortOrder: 3 },
];

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: {},
    inServiceIds: [],
    slotBusyIds: [],
  }),
  "a",
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: { a: 1 },
    inServiceIds: [],
    slotBusyIds: [],
  }),
  "b",
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: { a: 1, b: 1 },
    inServiceIds: ["c"],
    slotBusyIds: [],
  }),
  "a",
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: { a: 1, b: 1 },
    inServiceIds: [],
    slotBusyIds: [],
  }),
  "c",
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: { a: 1, b: 1, c: 0 },
    inServiceIds: ["c"],
    slotBusyIds: ["a"],
  }),
  "b",
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: { a: 1, b: 1, c: 1 },
    inServiceIds: ["a", "b", "c"],
    slotBusyIds: [],
  }),
  null,
);

assert.equal(
  pickWalkInStaff({
    rotation,
    walkInCounts: {},
    inServiceIds: [],
    slotBusyIds: [],
    offShiftIds: ["a"],
  }),
  "b",
);

console.log("Walk-in rotation verification passed.");
