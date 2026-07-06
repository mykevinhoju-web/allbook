import { type NextRequest, NextResponse } from "next/server";

import { TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "@/features/tenants/constants";
import { resolveDevTenantSlugFromEnv } from "@/features/tenants/utils/dev-tenant";
import { isPlatformHost } from "@/features/tenants/utils/resolve-host";
import { resolveTenantSlugFromRequest } from "@/features/tenants/utils/resolve-slug";
import {
  ADMIN_SESSION_COOKIE,
  STAFF_SESSION_COOKIE,
} from "@/lib/app-session";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  const tenantSlug = isPlatformHost(host)
    ? resolveDevTenantSlugFromEnv()
    : resolveTenantSlugFromRequest(request);

  if (tenantSlug) {
    response.headers.set(TENANT_SLUG_HEADER, tenantSlug);
    // Only write the cookie when missing/changed — avoids Set-Cookie on every hit.
    const existingSlug = request.cookies.get(TENANT_SLUG_COOKIE)?.value;
    if (existingSlug !== tenantSlug) {
      response.cookies.set(TENANT_SLUG_COOKIE, tenantSlug, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365 * 10,
      });
    }
  } else if (isPlatformHost(host)) {
    response.cookies.delete(TENANT_SLUG_COOKIE);
  }

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const staffToken = request.cookies.get(STAFF_SESSION_COOKIE)?.value;
  const isAuthed = Boolean(adminToken || staffToken);

  if (pathname === "/admin/login" || pathname === "/staff/login") {
    if (isAuthed) {
      const target = staffToken && !adminToken ? "/admin/bookings" : "/admin";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return response;
  }

  if (pathname.startsWith("/admin") && !isAuthed) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and Next internals so middleware does not run on
     * every image/font/manifest request.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
