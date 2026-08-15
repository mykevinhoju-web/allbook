import { isoToDatetimeLocal } from "@/features/booking/lib/schedule-utils";

/** Default night surcharge window: 9:00 PM → 10:00 AM (overnight). */
export const NIGHT_SURCHARGE_START = "21:00";
export const NIGHT_SURCHARGE_END = "10:00";

const HHMM_RE = /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

export type BookingPriceChannel = "internal" | "external";

export interface PricingAdjustments {
  /** Extra fee when booking starts in the night window (cents). 0 = off. */
  nightSurchargeCents: number;
  /** Local start of the surcharge window (HH:mm). Inclusive. */
  nightSurchargeStart: string;
  /** Local end of the surcharge window (HH:mm). Exclusive. */
  nightSurchargeEnd: string;
  /** Flat discount for internal cash walk-ins (cents). 0 = off. */
  discountCents: number;
  /** Apply internal discount on admin cash walk-in bookings (not card). */
  discountApplyInternal: boolean;
  /** Flat discount for customer online bookings (cents). 0 = off. */
  discountExternalCents: number;
  /** Apply external discount on customer online bookings. */
  discountApplyExternal: boolean;
}

export const DEFAULT_PRICING_ADJUSTMENTS: PricingAdjustments = {
  nightSurchargeCents: 0,
  nightSurchargeStart: NIGHT_SURCHARGE_START,
  nightSurchargeEnd: NIGHT_SURCHARGE_END,
  discountCents: 0,
  discountApplyInternal: false,
  discountExternalCents: 0,
  discountApplyExternal: false,
};

function nonNegativeCents(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function parseHhmm(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(HHMM_RE);
  if (!match) return fallback;
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

export function formatHhmmAmPm(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const hour = Number(hStr);
  const minute = Number(mStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return hhmm;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function formatNightWindowLabel(start: string, end: string): string {
  return `${formatHhmmAmPm(start)} – ${formatHhmmAmPm(end)}`;
}

function isHhmmInNightWindow(
  hhmm: string,
  start: string,
  end: string,
): boolean {
  if (start === end) return false;
  if (start < end) {
    return hhmm >= start && hhmm < end;
  }
  return hhmm >= start || hhmm < end;
}

export function parsePricingAdjustments(
  raw: unknown,
): PricingAdjustments | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;

  const discountCents = nonNegativeCents(input.discountCents);
  const hasExternalAmount = input.discountExternalCents !== undefined;
  // Older tenants shared one amount for both channels — copy when migrating.
  const discountExternalCents = hasExternalAmount
    ? nonNegativeCents(input.discountExternalCents)
    : Boolean(input.discountApplyExternal)
      ? discountCents
      : 0;

  return {
    nightSurchargeCents: nonNegativeCents(input.nightSurchargeCents),
    nightSurchargeStart: parseHhmm(
      input.nightSurchargeStart,
      NIGHT_SURCHARGE_START,
    ),
    nightSurchargeEnd: parseHhmm(input.nightSurchargeEnd, NIGHT_SURCHARGE_END),
    discountCents,
    discountApplyInternal: Boolean(input.discountApplyInternal),
    discountExternalCents,
    discountApplyExternal: Boolean(input.discountApplyExternal),
  };
}

export function mergePricingAdjustments(
  saved?: PricingAdjustments | null,
): PricingAdjustments {
  return { ...DEFAULT_PRICING_ADJUSTMENTS, ...saved };
}

/** True when local start time falls in the configured night window. */
export function isNightSurchargeStart(
  startsAtIso: string,
  timeZone: string,
  window?: { start?: string; end?: string },
): boolean {
  const local = isoToDatetimeLocal(startsAtIso, timeZone);
  const hhmm = local.slice(11, 16);
  const start = parseHhmm(window?.start, NIGHT_SURCHARGE_START);
  const end = parseHhmm(window?.end, NIGHT_SURCHARGE_END);
  return isHhmmInNightWindow(hhmm, start, end);
}

export interface BookingPriceBreakdown {
  baseCents: number;
  nightSurchargeCents: number;
  discountCents: number;
  totalCents: number;
  staffPayoutCents?: number;
}

export function applyPricingAdjustments(args: {
  baseCents: number;
  startsAtIso: string;
  timeZone: string;
  channel: BookingPriceChannel;
  adjustments: PricingAdjustments;
  /**
   * Internal bookings: discount only for cash.
   * Ignored for external (uses discountApplyExternal + discountExternalCents).
   */
  paymentMethod?: "cash" | "card" | null;
}): BookingPriceBreakdown {
  const adjustments = mergePricingAdjustments(args.adjustments);
  const nightSurchargeCents =
    adjustments.nightSurchargeCents > 0 &&
    isNightSurchargeStart(args.startsAtIso, args.timeZone, {
      start: adjustments.nightSurchargeStart,
      end: adjustments.nightSurchargeEnd,
    })
      ? adjustments.nightSurchargeCents
      : 0;

  let discountCents = 0;
  if (args.channel === "external") {
    if (
      adjustments.discountApplyExternal &&
      adjustments.discountExternalCents > 0
    ) {
      discountCents = adjustments.discountExternalCents;
    }
  } else if (
    adjustments.discountApplyInternal &&
    args.paymentMethod === "cash" &&
    adjustments.discountCents > 0
  ) {
    discountCents = adjustments.discountCents;
  }

  const totalCents = Math.max(
    0,
    args.baseCents + nightSurchargeCents - discountCents,
  );

  return {
    baseCents: args.baseCents,
    nightSurchargeCents,
    discountCents,
    totalCents,
  };
}
