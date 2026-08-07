import { isMarketplaceCategorySlug } from "@/features/category/constants";
import { parseTenantPathPrefix } from "@/features/tenants/utils/path-tenant";

/**
 * Marketplace browse/discovery + demo/sample surfaces protected in Private Preview.
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
    pathname === "/room" ||
    pathname.startsWith("/room/")
  ) {
    return false;
  }

  // Home is always reachable — page swaps Preview vs real marketplace.
  if (pathname === "/") return false;

  // Secret unlock route — handled by its own handler (sets cookie + redirect).
  if (
    pathname === "/allbook-internal-preview-9X4K2P" ||
    pathname.startsWith("/allbook-internal-preview-9X4K2P/")
  ) {
    return false;
  }

  // Docs: gated separately (admin-only page).
  if (pathname === "/docs" || pathname.startsWith("/docs/")) return false;

  const first = pathname.split("/").filter(Boolean)[0] ?? "";

  return (
    pathname.startsWith("/search") ||
    pathname.startsWith("/shops") ||
    pathname.startsWith("/salon") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/landing") ||
    // Apex demo + sample booking UIs (tenant /{slug}/booking remains open).
    pathname === "/booking" ||
    pathname.startsWith("/booking/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    isMarketplaceCategorySlug(first)
  );
}
