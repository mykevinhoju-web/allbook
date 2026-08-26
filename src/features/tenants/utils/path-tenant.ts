import { isMarketplaceCategorySlug } from "@/features/category/constants";

/**
 * First path segments reserved for the AllBook platform itself.
 * Anything else on the apex host may be treated as a tenant slug:
 * allbook.com.au/{slug}/...
 */
export const RESERVED_PATH_SEGMENTS = new Set([
  "_next",
  "admin",
  "allbook-internal-preview-9X4K2P",
  "api",
  "apple-icon.png",
  "auth",
  "barber",
  "booking",
  "brand",
  "dashboard",
  "docs",
  "facial",
  "favicon.ico",
  "hair",
  "icon.png",
  "icons",
  "landing",
  "login",
  "massage",
  "marketplace",
  "nails",
  "partner",
  "platform",
  "rand",
  "register",
  "room",
  "robots.txt",
  "salon",
  "search",
  "shops",
  "signup",
  "sitemap.xml",
  "spa",
  "staff",
  "waxing",
]);

const TENANT_SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export function isReservedPathSegment(segment: string): boolean {
  return RESERVED_PATH_SEGMENTS.has(segment.toLowerCase());
}

export function isValidTenantPathSlug(segment: string): boolean {
  return TENANT_SLUG_RE.test(segment) && !isReservedPathSegment(segment);
}

/**
 * Parse allbook.com.au/{slug}/rest → { slug, restPath }.
 * Returns null when the first segment is reserved or invalid.
 */
export function parseTenantPathPrefix(pathname: string): {
  slug: string;
  restPath: string;
} | null {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (!first || !isValidTenantPathSlug(first)) {
    return null;
  }

  const rest = segments.slice(1).join("/");
  return {
    slug: first.toLowerCase(),
    restPath: rest ? `/${rest}` : "/",
  };
}

/** Paths that should keep the /{slug} prefix in the browser URL on the apex host. */
export function shouldPrefixTenantPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/room" ||
    pathname.startsWith("/room/")
  );
}

/**
 * Apex marketing / auth surfaces — must not inherit tenant_slug cookie,
 * otherwise allbook.com.au/ shows a tenant home instead of the landing page.
 */
export function isPlatformApexPublicPath(pathname: string): boolean {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";

  return (
    pathname === "/" ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/login" ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/shops") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/salon") ||
    isMarketplaceCategorySlug(segment) ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/docs") ||
    pathname === "/allbook-internal-preview-9X4K2P" ||
    pathname.startsWith("/allbook-internal-preview-9X4K2P/")
  );
}
