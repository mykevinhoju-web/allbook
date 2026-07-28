import { isoToDatetimeLocal } from "@/features/booking/lib/schedule-utils";

/** Night surcharge window: 9:00 PM → 10:00 AM (overnight). */
export const NIGHT_SURCHARGE_START = "21:00";
export const NIGHT_SURCHARGE_END = "10:00";

export type BookingPriceChannel = "internal" | "external";

export interface PricingAdjustments {
  /** Extra fee when booking starts in the night window (cents). 0 = off. */
  nightSurchargeCents: number;
  /** Flat discount (cents). 0 = off. */
  discountCents: number;
  /** Apply discount on admin / walk-in bookings. */
  discountApplyInternal: boolean;
  /** Apply discount on customer online bookings. */
  discountApplyExternal: boolean;
}

export const DEFAULT_PRICING_ADJUSTMENTS: PricingAdjustments = {
  nightSurchargeCents: 0,
  discountCents: 0,
  discountApplyInternal: false,
  discountApplyExternal: false,
};

export function parsePricingAdjustments(
  raw: unknown,
): PricingAdjustments | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const input = raw as Record<string, unknown>;

  const nightSurchargeCents = Number(input.nightSurchargeCents);
  const discountCents = Number(input.discountCents);

  return {
    nightSurchargeCents:
      Number.isFinite(nightSurchargeCents) && nightSurchargeCents >= 0
        ? Math.round(nightSurchargeCents)
        : 0,
    discountCents:
      Number.isFinite(discountCents) && discountCents >= 0
        ? Math.round(discountCents)
        : 0,
    discountApplyInternal: Boolean(input.discountApplyInternal),
    discountApplyExternal: Boolean(input.discountApplyExternal),
  };
}

export function mergePricingAdjustments(
  saved?: PricingAdjustments | null,
): PricingAdjustments {
  return { ...DEFAULT_PRICING_ADJUSTMENTS, ...saved };
}

/** True when local start time is 21:00–23:59 or 00:00–09:59. */
export function isNightSurchargeStart(
  startsAtIso: string,
  timeZone: string,
): boolean {
  const local = isoToDatetimeLocal(startsAtIso, timeZone);
  const hhmm = local.slice(11, 16);
  return hhmm >= NIGHT_SURCHARGE_START || hhmm < NIGHT_SURCHARGE_END;
}

export interface BookingPriceBreakdown {
  baseCents: number;
  nightSurchargeCents: number;
  discountCents: number;
  totalCents: number;
}

export function applyPricingAdjustments(args: {
  baseCents: number;
  startsAtIso: string;
  timeZone: string;
  channel: BookingPriceChannel;
  adjustments: PricingAdjustments;
}): BookingPriceBreakdown {
  const adjustments = mergePricingAdjustments(args.adjustments);
  const nightSurchargeCents =
    adjustments.nightSurchargeCents > 0 &&
    isNightSurchargeStart(args.startsAtIso, args.timeZone)
      ? adjustments.nightSurchargeCents
      : 0;

  const discountAllowed =
    args.channel === "internal"
      ? adjustments.discountApplyInternal
      : adjustments.discountApplyExternal;
  const discountCents =
    discountAllowed && adjustments.discountCents > 0
      ? adjustments.discountCents
      : 0;

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
