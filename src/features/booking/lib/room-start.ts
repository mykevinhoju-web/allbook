import type { InternalPaymentMethod } from "./internal-payment-method";

const ROOM_START_RE = /\[roomstart(?::(cash|card|pre|split(?::(\d+))?))?\]/i;

export function isRoomStartBooking(notes?: string | null): boolean {
  if (!notes) return false;
  return ROOM_START_RE.test(notes);
}

export function parseRoomStartPayment(
  notes?: string | null,
): InternalPaymentMethod | null {
  if (!notes) return null;
  const match = notes.match(ROOM_START_RE);
  const method = match?.[1]?.toLowerCase();
  if (method === "cash" || method === "card" || method === "pre") {
    return method;
  }
  if (method?.startsWith("split")) return "split";
  return null;
}

export function parseRoomStartSplitCashCents(
  notes?: string | null,
): number | null {
  if (!notes) return null;
  const match = notes.match(ROOM_START_RE);
  const cash = Number(match?.[2]);
  return Number.isFinite(cash) && cash > 0 ? Math.round(cash) : null;
}

export function withRoomStartNote(
  method: InternalPaymentMethod,
  notes?: string | null,
  splitCashCents?: number | null,
): string {
  const rest = stripRoomStartNote(notes).trim();
  const marker =
    method === "split"
      ? `[roomstart:split:${Math.max(0, Math.round(Number(splitCashCents) || 0))}]`
      : `[roomstart:${method}]`;
  return rest ? `${marker} ${rest}` : marker;
}

export function stripRoomStartNote(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .replace(/\s*\[roomstart(?::(?:cash|card|pre|split(?::\d+)?))?\]\s*/gi, " ")
    .trim();
}

export function isPendingRoomStartBooking(booking: {
  paymentStatus?: string | null;
  checkedInAt?: string | null;
  notes?: string | null;
  status?: string;
}): boolean {
  if (booking.status === "cancelled" || booking.status === "completed") {
    return false;
  }
  if (booking.checkedInAt) return false;
  if (booking.paymentStatus !== "unpaid") return false;
  return isRoomStartBooking(booking.notes);
}
