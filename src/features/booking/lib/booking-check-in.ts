import type { AdminBooking } from "../types/admin-booking";

/** Minimum service length after check-in when capped by the next booking. */
export const MIN_CHECK_IN_SERVICE_MS = 60_000;

export function isBookingCheckedIn(
  booking: Pick<AdminBooking, "checkedInAt" | "checkedOutAt" | "status">,
): boolean {
  return (
    Boolean(booking.checkedInAt) &&
    !booking.checkedOutAt &&
    booking.status !== "completed" &&
    booking.status !== "cancelled"
  );
}

export function canCheckInToBooking(
  booking: Pick<
    AdminBooking,
    "startsAt" | "endsAt" | "checkedInAt" | "checkedOutAt" | "status"
  >,
  at: Date = new Date(),
): boolean {
  if (
    booking.checkedInAt ||
    booking.checkedOutAt ||
    booking.status === "completed" ||
    booking.status === "cancelled"
  ) {
    return false;
  }

  const atMs = at.getTime();
  const startMs = new Date(booking.startsAt).getTime();
  const endMs = new Date(booking.endsAt).getTime();
  const earliestMs = startMs - 60 * 60_000;

  return atMs >= earliestMs && atMs < endMs;
}

export function getActiveCheckedInBooking<T extends AdminBooking>(
  bookings: T[],
): T | null {
  return bookings.find((booking) => isBookingCheckedIn(booking)) ?? null;
}

/**
 * Service clock starts at real check-in: ends = check-in + purchased duration,
 * capped so it does not run into the next room/staff booking.
 */
export function computeCheckInServiceWindow(
  checkedInAt: Date,
  durationMinutes: number,
  blockingStartsAt: Array<Date | string>,
):
  | { ok: true; startsAt: string; endsAt: string; wasCapped: boolean }
  | { ok: false; error: string } {
  const startMs = checkedInAt.getTime();
  if (!Number.isFinite(startMs) || durationMinutes <= 0) {
    return { ok: false, error: "Invalid service duration." };
  }

  let endMs = startMs + durationMinutes * 60_000;
  let wasCapped = false;

  for (const raw of blockingStartsAt) {
    const blockMs = new Date(raw).getTime();
    if (!Number.isFinite(blockMs)) continue;
    if (blockMs > startMs && blockMs < endMs) {
      endMs = blockMs;
      wasCapped = true;
    }
  }

  if (endMs - startMs < MIN_CHECK_IN_SERVICE_MS) {
    return {
      ok: false,
      error: "Not enough time before the next booking.",
    };
  }

  return {
    ok: true,
    startsAt: new Date(startMs).toISOString(),
    endsAt: new Date(endMs).toISOString(),
    wasCapped,
  };
}
