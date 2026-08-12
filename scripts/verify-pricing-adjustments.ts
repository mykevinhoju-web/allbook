/**
 * Quick check: night surcharge window + channel discount.
 * Run: npx tsx scripts/verify-pricing-adjustments.ts
 */
import {
  applyPricingAdjustments,
  isNightSurchargeStart,
  type PricingAdjustments,
} from "../src/features/services/lib/pricing-adjustments";

const tz = "Australia/Sydney";
const adjustments: PricingAdjustments = {
  nightSurchargeCents: 2000,
  discountCents: 1000,
  discountApplyInternal: true,
  discountExternalCents: 500,
  discountApplyExternal: false,
};

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// 2026-07-28 21:30 Sydney = UTC+10 → 11:30Z
const nightStart = "2026-07-28T11:30:00.000Z";
const dayStart = "2026-07-28T02:00:00.000Z"; // 12:00 Sydney

assert(isNightSurchargeStart(nightStart, tz), "21:30 should be night");
assert(!isNightSurchargeStart(dayStart, tz), "12:00 should not be night");

const nightExternal = applyPricingAdjustments({
  baseCents: 5500,
  startsAtIso: nightStart,
  timeZone: tz,
  channel: "external",
  adjustments,
});
assert(nightExternal.nightSurchargeCents === 2000, "night surcharge applied");
assert(nightExternal.discountCents === 0, "external discount off");
assert(nightExternal.totalCents === 7500, "55+20=75");

const nightExternalOn = applyPricingAdjustments({
  baseCents: 5500,
  startsAtIso: nightStart,
  timeZone: tz,
  channel: "external",
  adjustments: { ...adjustments, discountApplyExternal: true },
});
assert(nightExternalOn.discountCents === 500, "external uses its own amount");
assert(nightExternalOn.totalCents === 7000, "55+20-5=70");

const nightInternalCash = applyPricingAdjustments({
  baseCents: 5500,
  startsAtIso: nightStart,
  timeZone: tz,
  channel: "internal",
  adjustments,
  paymentMethod: "cash",
});
assert(nightInternalCash.discountCents === 1000, "cash discount on");
assert(nightInternalCash.totalCents === 6500, "55+20-10=65");

const nightInternalCard = applyPricingAdjustments({
  baseCents: 5500,
  startsAtIso: nightStart,
  timeZone: tz,
  channel: "internal",
  adjustments,
  paymentMethod: "card",
});
assert(nightInternalCard.discountCents === 0, "card discount off");
assert(nightInternalCard.totalCents === 7500, "55+20=75");

const morning = "2026-07-28T23:30:00.000Z"; // 09:30 Sydney
assert(isNightSurchargeStart(morning, tz), "09:30 should be night window");

const afterTen = "2026-07-29T00:05:00.000Z"; // 10:05 Sydney
assert(!isNightSurchargeStart(afterTen, tz), "10:05 should not be night");

console.log("verify-pricing-adjustments: ok");
