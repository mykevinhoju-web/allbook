import { TENANT_ENV } from "../constants";

/**
 * Tenant used for customer `/booking` on the platform apex (allbook.com.au).
 * Defaults to dayspa so the public demo works without extra Vercel config.
 */
export function resolvePlatformBookingTenantSlug(): string {
  return (
    process.env.PLATFORM_BOOKING_TENANT_SLUG ??
    process.env.NEXT_PUBLIC_PLATFORM_BOOKING_TENANT_SLUG ??
    process.env[TENANT_ENV.slug] ??
    process.env[TENANT_ENV.publicSlug] ??
    "dayspa"
  );
}

/** Paths that should resolve a demo tenant on the platform host. */
export function isPlatformBookingPath(pathname: string): boolean {
  return (
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/api/booking" ||
    pathname.startsWith("/api/booking/")
  );
}
