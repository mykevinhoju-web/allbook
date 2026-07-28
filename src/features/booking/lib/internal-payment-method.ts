/** Admin / walk-in payment method (no Stripe — recorded for pricing & revenue). */
export type InternalPaymentMethod = "cash" | "card";

const PAY_MARKER_RE = /^\[pay:(cash|card)\](?:\s+|$)/i;

export function isInternalPaymentMethod(
  value: unknown,
): value is InternalPaymentMethod {
  return value === "cash" || value === "card";
}

/** Persist method in notes without a schema migration. */
export function withPaymentMethodNote(
  method: InternalPaymentMethod,
  notes?: string | null,
): string {
  const rest = stripPaymentMethodNote(notes).trim();
  return rest ? `[pay:${method}] ${rest}` : `[pay:${method}]`;
}

export function parsePaymentMethodFromNotes(
  notes?: string | null,
): InternalPaymentMethod | null {
  if (!notes) return null;
  const match = notes.trim().match(PAY_MARKER_RE);
  if (!match?.[1]) return null;
  const method = match[1].toLowerCase();
  return method === "cash" || method === "card" ? method : null;
}

export function stripPaymentMethodNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(PAY_MARKER_RE, "").trim();
}
