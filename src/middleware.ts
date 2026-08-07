import { type NextRequest, NextResponse } from "next/server";

import { TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "@/features/tenants/constants";
import { resolveDevTenantSlugFromEnv } from "@/features/tenants/utils/dev-tenant";
import {
  isPlatformApexPublicPath,
  parseTenantPathPrefix,
  shouldPrefixTenantPath,
} from "@/features/tenants/utils/path-tenant";
import { isPlatformHost } from "@/features/tenants/utils/resolve-host";
import { resolveTenantSlugFromHost } from "@/features/tenants/utils/resolve-slug";
import {
  signTenantSlugToken,
  verifyTenantSlugToken,
} from "@/features/tenants/utils/tenant-slug-token";
import {
  ADMIN_SESSION_COOKIE,
  STAFF_SESSION_COOKIE,
} from "@/lib/app-session";
import { resolvePlatformAdminAccess } from "@/features/platform/server/platform-admin-middleware";
import {
  isMarketplacePreviewProtectedPath,
  isPrivatePreviewEnabled,
} from "@/features/private-preview";
import { updateSession } from "@/lib/supabase/middleware";

function withTenantHeaders(
  request: NextRequest,
  pathname: string,
  tenantSlug: string | null,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  // Strip any client-supplied tenant header, then set verified value only.
  requestHeaders.delete(TENANT_SLUG_HEADER);
  if (tenantSlug) {
    requestHeaders.set(TENANT_SLUG_HEADER, tenantSlug);
  }
  return requestHeaders;
}

async function applyTenantCookie(
  response: NextResponse,
  request: NextRequest,
  tenantSlug: string | null,
  host: string,
) {
  if (tenantSlug) {
    response.headers.set(TENANT_SLUG_HEADER, tenantSlug);
    const existingRaw = request.cookies.get(TENANT_SLUG_COOKIE)?.value;
    const existingSlug = await verifyTenantSlugToken(existingRaw);
    if (existingSlug !== tenantSlug) {
      const token = await signTenantSlugToken(tenantSlug);
      response.cookies.set(TENANT_SLUG_COOKIE, token, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365 * 10,
      });
    }
  } else if (isPlatformHost(host) && !request.nextUrl.pathname.startsWith("/api")) {
    const path = request.nextUrl.pathname;
    if (isPlatformApexPublicPath(path)) {
      response.cookies.delete(TENANT_SLUG_COOKIE);
    }
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const { pathname } = request.nextUrl;
  const platform = isPlatformHost(host);

  const pathTenant = platform ? parseTenantPathPrefix(pathname) : null;
  const verifiedCookieSlug = await verifyTenantSlugToken(
    request.cookies.get(TENANT_SLUG_COOKIE)?.value,
  );

  // Bare /admin on apex → /{slug}/admin so URLs stay allbook.com.au/{slug}/...
  if (
    platform &&
    !pathTenant &&
    verifiedCookieSlug &&
    shouldPrefixTenantPath(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${verifiedCookieSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  let tenantSlug: string | null = null;
  let rewritePath: string | null = null;

  if (platform && pathTenant) {
    // Verified mapping: path prefix /{slug}/...
    tenantSlug = pathTenant.slug;
    rewritePath = pathTenant.restPath;
  } else if (platform && isPlatformApexPublicPath(pathname)) {
    tenantSlug = null;
  } else if (platform) {
    // /api and similar on apex: signed cookie or local env — never client header.
    tenantSlug = verifiedCookieSlug ?? resolveDevTenantSlugFromEnv();
  } else {
    // Tenant subdomain host — verified hostname mapping only.
    tenantSlug =
      resolveTenantSlugFromHost(host) ?? resolveDevTenantSlugFromEnv();
  }

  const effectivePathname = rewritePath ?? pathname;
  const requestHeaders = withTenantHeaders(
    request,
    effectivePathname,
    tenantSlug,
  );

  const hasSupabaseAuth = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );

  let response: NextResponse;

  if (rewritePath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath;
    response = NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  } else if (hasSupabaseAuth) {
    response = await updateSession(request);
    response.headers.set("x-pathname", effectivePathname);
    if (tenantSlug) {
      response.headers.set(TENANT_SLUG_HEADER, tenantSlug);
    }
  } else {
    response = NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  await applyTenantCookie(response, request, tenantSlug, host);

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const staffToken = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  const isAuthed = Boolean(adminToken || staffToken);

  if (
    effectivePathname === "/admin/login" ||
    effectivePathname === "/staff/login"
  ) {
    if (isAuthed) {
      const target = staffToken && !adminToken ? "/staff" : "/admin";
      const dest = tenantSlug && platform ? `/${tenantSlug}${target}` : target;
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return response;
  }

  if (
    effectivePathname.startsWith("/staff") &&
    effectivePathname !== "/staff/login"
  ) {
    if (!staffToken) {
      const login =
        tenantSlug && platform
          ? `/${tenantSlug}/staff/login`
          : "/staff/login";
      return NextResponse.redirect(new URL(login, request.url));
    }
    return response;
  }

  if (effectivePathname.startsWith("/admin") && !isAuthed) {
    const login =
      tenantSlug && platform ? `/${tenantSlug}/admin/login` : "/admin/login";
    return NextResponse.redirect(new URL(login, request.url));
  }

  // /platform/salon/* — authenticated salon owners (layout enforces ownership).
  // Platform admins may also enter. Do NOT require profiles.role = admin.
  if (
    pathname === "/platform/salon" ||
    pathname.startsWith("/platform/salon/")
  ) {
    const access = await resolvePlatformAdminAccess(request, requestHeaders);
    await applyTenantCookie(access.response, request, tenantSlug, host);
    if (!access.hasUser) {
      return NextResponse.redirect(
        new URL("/login?next=/platform/salon", request.url),
      );
    }
    return access.response;
  }

  // AllBook Admin (/platform) — Supabase Auth + profiles.role = 'admin' only.
  if (pathname.startsWith("/platform")) {
    const access = await resolvePlatformAdminAccess(request, requestHeaders);
    await applyTenantCookie(access.response, request, tenantSlug, host);

    if (pathname === "/platform/login") {
      if (access.isAdmin) {
        return NextResponse.redirect(new URL("/platform", request.url));
      }
      return access.response;
    }

    if (!access.hasUser) {
      return NextResponse.redirect(new URL("/platform/login", request.url));
    }
    if (!access.isAdmin) {
      return NextResponse.redirect(
        new URL("/platform/login?error=not_admin", request.url),
      );
    }
    return access.response;
  }

  // Private Preview — Marketplace + samples stay admin-only on apex.
  if (
    isPrivatePreviewEnabled() &&
    platform &&
    isMarketplacePreviewProtectedPath(pathname)
  ) {
    const access = await resolvePlatformAdminAccess(request, requestHeaders);
    await applyTenantCookie(access.response, request, tenantSlug, host);
    if (!access.isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return access.response;
  }

  // Docs section — platform admins only while in Private Preview.
  if (
    isPrivatePreviewEnabled() &&
    platform &&
    (pathname === "/docs" || pathname.startsWith("/docs/"))
  ) {
    const access = await resolvePlatformAdminAccess(request, requestHeaders);
    await applyTenantCookie(access.response, request, tenantSlug, host);
    if (!access.isAdmin) {
      return NextResponse.redirect(new URL("/platform/login", request.url));
    }
    return access.response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
