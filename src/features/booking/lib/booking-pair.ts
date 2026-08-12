import { stripPaymentMethodNote } from "./internal-payment-method";

const PAIR_NOTE_RE = /\[pair:([0-9a-f-]{36})\]/i;

/** Companion bookings store the primary visit id in notes: `[pair:<primaryBookingId>]`. */
export function parsePairBookingId(notes?: string | null): string | null {
  if (!notes) return null;
  const cleaned = stripPaymentMethodNote(notes);
  const match = cleaned.match(PAIR_NOTE_RE);
  return match?.[1] ?? null;
}

export function pairBookingNote(primaryBookingId: string): string {
  return `[pair:${primaryBookingId}]`;
}

/** Group bookings on a day by shared visit (primary id + its companions). */
export function groupBookingsByVisit<T extends { id: string; notes?: string | null }>(
  bookings: T[],
): Map<string, T[]> {
  const byId = new Map(bookings.map((row) => [row.id, row]));
  const groups = new Map<string, T[]>();

  const visitKey = (booking: T): string => {
    const primaryId = parsePairBookingId(booking.notes);
    return primaryId ?? booking.id;
  };

  for (const booking of bookings) {
    const key = visitKey(booking);
    const primary = byId.get(key);
    const anchor = primary ?? (parsePairBookingId(booking.notes) ? byId.get(key) : booking);
    const resolvedKey = anchor ? visitKey(anchor) : key;
    const list = groups.get(resolvedKey) ?? [];
    if (!list.some((row) => row.id === booking.id)) {
      list.push(booking);
    }
    groups.set(resolvedKey, list);
  }

  return groups;
}
