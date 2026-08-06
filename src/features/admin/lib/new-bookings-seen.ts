const STORAGE_PREFIX = "allbook:new-bookings-seen:";

export function newBookingsSeenStorageKey(tenantSlug: string): string {
  return `${STORAGE_PREFIX}${tenantSlug}`;
}

export function readNewBookingsSeenAt(tenantSlug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(newBookingsSeenStorageKey(tenantSlug));
  } catch {
    return null;
  }
}

/** Persist "seen" watermark. Returns the ISO timestamp written. */
export function writeNewBookingsSeenAt(
  tenantSlug: string,
  at = new Date().toISOString(),
): string {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(newBookingsSeenStorageKey(tenantSlug), at);
    } catch {
      // ignore quota / private mode
    }
  }
  return at;
}
