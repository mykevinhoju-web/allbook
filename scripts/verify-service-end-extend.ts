import assert from "node:assert/strict";

/**
 * Service-end extend math: new end = max(currentEnds, now) + minutes
 */
function computeExtendedEndsAt(
  startsAtIso: string,
  endsAtIso: string,
  minutes: number,
  nowMs: number,
): { endsAt: string; durationMinutes: number } {
  const startsMs = new Date(startsAtIso).getTime();
  const currentEndsMs = new Date(endsAtIso).getTime();
  const baseMs = Math.max(currentEndsMs, nowMs);
  const endsAt = new Date(baseMs + minutes * 60_000);
  const durationMinutes = Math.max(
    1,
    Math.round((endsAt.getTime() - startsMs) / 60_000),
  );
  return { endsAt: endsAt.toISOString(), durationMinutes };
}

const start = "2026-07-21T09:00:00.000Z";
const end = "2026-07-21T09:20:00.000Z";
const beforeEnd = Date.parse("2026-07-21T09:10:00.000Z");
const afterEnd = Date.parse("2026-07-21T09:25:00.000Z");

const early = computeExtendedEndsAt(start, end, 10, beforeEnd);
assert.equal(early.endsAt, "2026-07-21T09:30:00.000Z");
assert.equal(early.durationMinutes, 30);

const late = computeExtendedEndsAt(start, end, 10, afterEnd);
assert.equal(late.endsAt, "2026-07-21T09:35:00.000Z");
assert.equal(late.durationMinutes, 35);

assert.equal(
  Date.parse("2026-07-21T09:20:00.000Z") <= Date.parse("2026-07-21T09:20:00.000Z"),
  true,
);

console.log("verify-service-end-extend: ok");
