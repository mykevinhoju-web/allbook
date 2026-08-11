/**
 * Marketplace demo / matching guards.
 *
 * Production is blocked by default. Set ALLOW_MARKETPLACE_DEMO=true on
 * Preview (or temporarily on Production) to verify the Phase 1 demo.
 */

export function isMarketplaceDemoAllowed(): boolean {
  if (process.env.ALLOW_MARKETPLACE_DEMO === "true") return true;
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.NODE_ENV !== "production";
}

export function assertMarketplaceDemoAllowed(): void {
  if (!isMarketplaceDemoAllowed()) {
    throw new Error(
      "Marketplace demo/seed is disabled in production. Set ALLOW_MARKETPLACE_DEMO=true on a non-locked environment to enable it.",
    );
  }
}
