/** Allowed extend lengths (minutes) across admin + room APIs. */
export const EXTEND_MINUTE_OPTIONS = [5, 10, 15, 20, 30] as const;

export type ExtendMinuteOption = (typeof EXTEND_MINUTE_OPTIONS)[number];

export function getExtendBaseMs(
  currentEndsAt: string | Date,
  now: Date = new Date(),
): number {
  const endsMs = new Date(currentEndsAt).getTime();
  return Math.max(Number.isFinite(endsMs) ? endsMs : 0, now.getTime());
}

/**
 * Earliest blocking start after the extend base (next room/staff booking).
 * Returns null when nothing blocks.
 */
export function getNextBlockingStartMs(
  baseMs: number,
  blockingStartsAt: Array<string | Date | null | undefined>,
): number | null {
  let limit: number | null = null;
  for (const raw of blockingStartsAt) {
    if (raw == null) continue;
    const ms = new Date(raw).getTime();
    if (!Number.isFinite(ms) || ms <= baseMs) continue;
    if (limit === null || ms < limit) limit = ms;
  }
  return limit;
}

/**
 * Extend buttons that fit before the next booking.
 * Ending exactly when the next booking starts is allowed (no overlap).
 */
export function getAvailableExtendMinutes(
  currentEndsAt: string | Date,
  blockingStartsAt: Array<string | Date | null | undefined>,
  options: readonly number[] = EXTEND_MINUTE_OPTIONS,
  now: Date = new Date(),
): number[] {
  const baseMs = getExtendBaseMs(currentEndsAt, now);
  const limitMs = getNextBlockingStartMs(baseMs, blockingStartsAt);
  if (limitMs === null) {
    return [...options];
  }
  return options.filter((minutes) => baseMs + minutes * 60_000 <= limitMs);
}
