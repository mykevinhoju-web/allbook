export type ShiftTimelineSegmentKind = "past" | "available" | "booked";

export interface ShiftTimelineSegment {
  kind: ShiftTimelineSegmentKind;
  startMs: number;
  endMs: number;
}

export interface ShiftTimelineWindow {
  shiftStartMs: number;
  shiftEndMs: number;
  segments: ShiftTimelineSegment[];
}

function mergeAdjacentSegments(
  segments: ShiftTimelineSegment[],
): ShiftTimelineSegment[] {
  const merged: ShiftTimelineSegment[] = [];

  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.kind === segment.kind) {
      last.endMs = segment.endMs;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

/** Build proportional segments for a shift bar (booked vs open vs past). */
export function buildShiftTimeline(
  shiftStartIso: string,
  shiftEndIso: string,
  bookings: { startsAt: string; endsAt: string; status?: string }[],
  now = new Date(),
): ShiftTimelineWindow | null {
  const shiftStartMs = new Date(shiftStartIso).getTime();
  const shiftEndMs = new Date(shiftEndIso).getTime();

  if (
    Number.isNaN(shiftStartMs) ||
    Number.isNaN(shiftEndMs) ||
    shiftEndMs <= shiftStartMs
  ) {
    return null;
  }

  const nowMs = now.getTime();
  const activeBookings = bookings
    .filter(
      (booking) =>
        booking.status !== "cancelled" && booking.status !== "completed",
    )
    .map((booking) => ({
      start: new Date(booking.startsAt).getTime(),
      end: new Date(booking.endsAt).getTime(),
    }))
    .filter(
      (booking) =>
        !Number.isNaN(booking.start) &&
        !Number.isNaN(booking.end) &&
        booking.end > shiftStartMs &&
        booking.start < shiftEndMs,
    )
    .map((booking) => ({
      start: Math.max(shiftStartMs, booking.start),
      end: Math.min(shiftEndMs, booking.end),
    }))
    .sort((a, b) => a.start - b.start);

  const breakpoints = new Set<number>([shiftStartMs, shiftEndMs]);

  for (const booking of activeBookings) {
    breakpoints.add(booking.start);
    breakpoints.add(booking.end);
  }

  if (nowMs > shiftStartMs && nowMs < shiftEndMs) {
    breakpoints.add(nowMs);
  }

  const sorted = [...breakpoints].sort((a, b) => a - b);
  const raw: ShiftTimelineSegment[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const startMs = sorted[index]!;
    const endMs = sorted[index + 1]!;
    if (endMs <= startMs) continue;

    const mid = startMs + (endMs - startMs) / 2;
    const booked = activeBookings.some(
      (booking) => mid >= booking.start && mid < booking.end,
    );
    const kind: ShiftTimelineSegmentKind = booked
      ? "booked"
      : endMs <= nowMs
        ? "past"
        : "available";

    raw.push({ kind, startMs, endMs });
  }

  return {
    shiftStartMs,
    shiftEndMs,
    segments: mergeAdjacentSegments(raw),
  };
}

export function segmentWidthPercent(
  segment: ShiftTimelineSegment,
  window: ShiftTimelineWindow,
): number {
  const total = window.shiftEndMs - window.shiftStartMs;
  if (total <= 0) return 0;
  return ((segment.endMs - segment.startMs) / total) * 100;
}
