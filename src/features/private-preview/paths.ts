import { isMarketplaceCategorySlug } from "@/features/category/constants";
import { parseTenantPathPrefix } from "@/features/tenants/utils/path-tenant";

/**
 * Marketplace browse/discovery surfaces protected in Private Preview.
 * SaaS tenant paths (/{slug}/admin|booking|…) stay available.
 * Auth + platform admin + APIs stay available.
 */
export function isMarketplacePreviewProtectedPath(pathname: string): boolean {
  if (parseTenantPathPrefix(pathname)) {
    return false;
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/_next") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname.startsWith("/auth") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/room" ||
    pathname.startsWith("/room/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  ) {
    return false;
  }

  // Home is always reachable — page swaps Preview vs real marketplace.
  if (pathname === "/") return false;

  // Docs: gated separately (admin-only page).
  if (pathname === "/docs" || pathname.startsWith("/docs/")) return false;

  const first = pathname.split("/").filter(Boolean)[0] ?? "";

  return (
    pathname.startsWith("/search") ||
    pathname.startsWith("/shops") ||
    pathname.startsWith("/salon") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/landing") ||
    isMarketplaceCategorySlug(first)
  );
}
