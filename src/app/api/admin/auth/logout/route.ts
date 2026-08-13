import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getAdminReportsUnlockCookieName,
  getAdminReportsUnlockCookieOptions,
} from "@/lib/admin-reports-unlock";
import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const host = request.headers.get("host");
  cookieStore.set(getAdminSessionCookieName(), "", {
    ...getAdminSessionCookieOptions(host),
    maxAge: 0,
  });
  cookieStore.set(getAdminReportsUnlockCookieName(), "", {
    ...getAdminReportsUnlockCookieOptions(host),
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
