import { NextResponse } from "next/server";

import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  verifyAdminSession,
} from "@/lib/admin-session";

/**
 * Cross-subdomain handoff: apex signup sets a token; tenant host accepts it
 * and writes the admin session cookie for that host (or shared parent domain).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const session = await verifyAdminSession(token);
  if (!session) {
    return NextResponse.redirect(
      new URL("/login?error=session_expired", url.origin),
    );
  }

  const response = NextResponse.redirect(new URL("/admin", url.origin));
  response.cookies.set(
    getAdminSessionCookieName(),
    token,
    getAdminSessionCookieOptions(request.headers.get("host")),
  );
  return response;
}
