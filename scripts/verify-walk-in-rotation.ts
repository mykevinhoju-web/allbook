/**
 * Run: npx tsx scripts/verify-walk-in-rotation.ts
 */
import assert from "node:assert/strict";

import {
  appendNewcomersAtEnd,
  fillRotationNumbers,
  pickWalkInStaff,
} from "../src/features/booking/lib/walk-in-rotation";

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

assert.deepEqual(
  fillRotationNumbers([
    { staffId: "a", sortOrder: 0 },
    { staffId: "b", sortOrder: 0 },
    { staffId: "c", sortOrder: 0 },
  ]).map((row) => [row.staffId, row.sortOrder]),
  [
    ["a", 0],
    ["b", 0],
    ["c", 0],
  ],
);

assert.deepEqual(
  fillRotationNumbers([
    { staffId: "a", sortOrder: 1 },
    { staffId: "b", sortOrder: 2 },
    { staffId: "c", sortOrder: 3 },
  ]).map((row) => [row.staffId, row.sortOrder]),
  [
    ["a", 0],
    ["b", 0],
    ["c", 0],
  ],
);

const withNewcomer = appendNewcomersAtEnd(rotation, ["d", "a"]);
assert.deepEqual(
  withNewcomer.map((row) => [row.staffId, row.sortOrder]),
  [
    ["a", 0],
    ["b", 0],
    ["c", 0],
    ["d", 0],
  ],
);

const custom = [
  { staffId: "a", sortOrder: 1 },
  { staffId: "b", sortOrder: 3 },
  { staffId: "c", sortOrder: 5 },
];
const customWithNewcomer = appendNewcomersAtEnd(custom, ["d"]);
assert.deepEqual(
  customWithNewcomer.map((row) => [row.staffId, row.sortOrder]),
  [
    ["a", 1],
    ["b", 3],
    ["c", 5],
    ["d", 6],
  ],
);

assert.equal(
  pickWalkInStaff({
    rotation: withNewcomer,
    walkInCounts: { a: 0, b: 0, c: 0, d: 0 },
    inServiceIds: [],
    slotBusyIds: [],
  }),
  "a",
);

assert.equal(
  pickWalkInStaff({
    rotation: customWithNewcomer,
    walkInCounts: { a: 2, b: 2, c: 1, d: 0 },
    inServiceIds: [],
    slotBusyIds: [],
  }),
  "d",
);

console.log("Walk-in rotation verification passed.");
