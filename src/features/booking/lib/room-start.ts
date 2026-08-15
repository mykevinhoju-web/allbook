const ROOM_START_RE = /\[roomstart(?::(cash|card))?\]/i;

export function isRoomStartBooking(notes?: string | null): boolean {
  if (!notes) return false;
  return ROOM_START_RE.test(notes);
}

export function parseRoomStartPayment(
  notes?: string | null,
): "cash" | "card" | null {
  if (!notes) return null;
  const match = notes.match(ROOM_START_RE);
  const method = match?.[1]?.toLowerCase();
  return method === "cash" || method === "card" ? method : null;
}

export function withRoomStartNote(
  method: "cash" | "card",
  notes?: string | null,
): string {
  const rest = stripRoomStartNote(notes).trim();
  const marker = `[roomstart:${method}]`;
  return rest ? `${marker} ${rest}` : marker;
}

export function stripRoomStartNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/\s*\[roomstart(?::(?:cash|card))?\]\s*/gi, " ").trim();
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
