import { stripPaymentMethodNote } from "./internal-payment-method";

const OUTCALL_MARKER_RE = /\[outcall\]/i;

/** Off-site / out-call visit — no treatment room. Stored in notes. */
export function isOutCallBooking(notes?: string | null): boolean {
  if (!notes) return false;
  return OUTCALL_MARKER_RE.test(notes);
}

export function withOutCallNote(notes?: string | null): string {
  const rest = stripOutCallNote(notes).trim();
  return rest ? `[outcall] ${rest}` : "[outcall]";
}

export function stripOutCallNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/\[outcall\]\s*/gi, "").trim();
}

export function visibleBookingNotes(notes?: string | null): string | null {
  const cleaned = stripOutCallNote(stripPaymentMethodNote(notes)).trim();
  return cleaned || null;
}
