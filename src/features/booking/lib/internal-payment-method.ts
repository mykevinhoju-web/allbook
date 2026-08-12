/** Admin / walk-in payment method (no Stripe — recorded for pricing & revenue). */
export type InternalPaymentMethod = "cash" | "card" | "split" | "pre";

/** Methods that finalize payment at booking time (eligible for revenue). */
export type SettledInternalPaymentMethod = "cash" | "card" | "split";

const PAY_MARKER_RE =
  /^\[pay:(cash|card|pre|split:(\d+))\](?:\s+|$)/i;

export type ParsedInternalPayment = {
  method: InternalPaymentMethod;
  /** Cash portion in cents when method is split. */
  splitCashCents: number | null;
};

export function isInternalPaymentMethod(
  value: unknown,
): value is InternalPaymentMethod {
  return (
    value === "cash" ||
    value === "card" ||
    value === "split" ||
    value === "pre"
  );
}

export function isCashOrCardMethod(
  value: unknown,
): value is "cash" | "card" {
  return value === "cash" || value === "card";
}

export function isSettledInternalPaymentMethod(
  value: unknown,
): value is SettledInternalPaymentMethod {
  return value === "cash" || value === "card" || value === "split";
}

/** Cash discount only applies to full cash payments. */
export function paymentMethodForPricing(
  method: InternalPaymentMethod | null | undefined,
): "cash" | "card" | null {
  if (method === "cash") return "cash";
  if (method === "card" || method === "split" || method === "pre") return "card";
  return null;
}

export function validateSplitCashCents(
  splitCashCents: unknown,
  totalCents: number,
): number | null {
  const cash = Number(splitCashCents);
  if (!Number.isFinite(cash) || cash <= 0) return null;
  const rounded = Math.round(cash);
  if (rounded >= totalCents) return null;
  return rounded;
}

/** Persist method in notes without a schema migration. */
export function withPaymentMethodNote(
  method: InternalPaymentMethod,
  notes?: string | null,
  splitCashCents?: number | null,
): string {
  const rest = stripPaymentMethodNote(notes).trim();
  let marker: string;
  if (method === "split") {
    const cash = Math.max(0, Math.round(Number(splitCashCents) || 0));
    marker = `[pay:split:${cash}]`;
  } else {
    marker = `[pay:${method}]`;
  }
  return rest ? `${marker} ${rest}` : marker;
}

export function parsePaymentDetailsFromNotes(
  notes?: string | null,
): ParsedInternalPayment | null {
  if (!notes) return null;
  const match = notes.trim().match(PAY_MARKER_RE);
  if (!match?.[1]) return null;
  const raw = match[1].toLowerCase();
  if (raw === "cash" || raw === "card" || raw === "pre") {
    return { method: raw, splitCashCents: null };
  }
  if (raw.startsWith("split:")) {
    const cash = Number(match[2]);
    return {
      method: "split",
      splitCashCents:
        Number.isFinite(cash) && cash >= 0 ? Math.round(cash) : 0,
    };
  }
  return null;
}

export function parsePaymentMethodFromNotes(
  notes?: string | null,
): InternalPaymentMethod | null {
  return parsePaymentDetailsFromNotes(notes)?.method ?? null;
}

export function parseSplitCashCentsFromNotes(
  notes?: string | null,
): number | null {
  const parsed = parsePaymentDetailsFromNotes(notes);
  if (!parsed || parsed.method !== "split") return null;
  return parsed.splitCashCents;
}

export function stripPaymentMethodNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(PAY_MARKER_RE, "").trim();
}

export function paymentStatusForMethod(
  method: InternalPaymentMethod,
): "unpaid" | "not_required" {
  return method === "pre" ? "unpaid" : "not_required";
}

/** Split booking revenue into cash vs card/online cents. */
export function splitRevenueCents(args: {
  priceCents: number;
  paymentStatus: string;
  notes?: string | null;
}): { cashCents: number; cardCents: number } {
  const total = Math.max(0, args.priceCents || 0);
  if (args.paymentStatus === "unpaid") {
    return { cashCents: 0, cardCents: 0 };
  }
  if (args.paymentStatus === "paid") {
    // Stripe / online checkout
    return { cashCents: 0, cardCents: total };
  }

  const parsed = parsePaymentDetailsFromNotes(args.notes);
  if (!parsed || parsed.method === "pre") {
    return { cashCents: 0, cardCents: total };
  }
  if (parsed.method === "cash") {
    return { cashCents: total, cardCents: 0 };
  }
  if (parsed.method === "card") {
    return { cashCents: 0, cardCents: total };
  }
  const cash = Math.min(total, Math.max(0, parsed.splitCashCents ?? 0));
  return { cashCents: cash, cardCents: total - cash };
}

export function formatPaymentMethodLabel(
  method: InternalPaymentMethod | null | undefined,
  splitCashCents?: number | null,
  totalCents?: number | null,
): string {
  if (!method) return "—";
  if (method === "cash") return "Cash";
  if (method === "card") return "Card";
  if (method === "pre") return "Pre booking";
  if (method === "split") {
    if (
      splitCashCents != null &&
      totalCents != null &&
      totalCents > splitCashCents
    ) {
      const cash = (splitCashCents / 100).toFixed(0);
      const card = ((totalCents - splitCashCents) / 100).toFixed(0);
      return `Split · cash $${cash} + card $${card}`;
    }
    return "Split";
  }
  return method;
}
