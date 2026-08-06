/** Pure time helpers for the booking engine (minutes from midnight). */

export function parseTimeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) throw new Error(`Invalid time: ${time}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Invalid time: ${time}`);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(total: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, total));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(time: string, minutes: number): string {
  return formatMinutesToTime(parseTimeToMinutes(time) + minutes);
}

/** Half-open overlap: [aStart, aEnd) vs [bStart, bEnd) */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function mergeRanges(
  ranges: { start: number; end: number }[],
): { start: number; end: number }[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

export function subtractBusyFromWindow(
  windowStart: number,
  windowEnd: number,
  busy: { start: number; end: number }[],
): { start: number; end: number }[] {
  if (windowEnd <= windowStart) return [];
  const clipped = mergeRanges(
    busy
      .map((b) => ({
        start: Math.max(windowStart, b.start),
        end: Math.min(windowEnd, b.end),
      }))
      .filter((b) => b.end > b.start),
  );

  const free: { start: number; end: number }[] = [];
  let cursor = windowStart;
  for (const block of clipped) {
    if (block.start > cursor) {
      free.push({ start: cursor, end: block.start });
    }
    cursor = Math.max(cursor, block.end);
  }
  if (cursor < windowEnd) {
    free.push({ start: cursor, end: windowEnd });
  }
  return free;
}

/** Monday = 0 … Sunday = 6 (matches salon-staff). */
export function getDayOfWeekMondayFirst(dateIso: string): number {
  const date = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${dateIso}`);
  const jsDay = date.getDay(); // Sun=0
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function isDateInLeaveRange(
  dateIso: string,
  leave: { startDate: string; endDate: string },
): boolean {
  return dateIso >= leave.startDate && dateIso <= leave.endDate;
}

export const SLOT_INTERVAL_MINUTES = 15;

export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
] as const;
