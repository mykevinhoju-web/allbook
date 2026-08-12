import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const name = getAdminSessionCookieName();
  const options = getAdminSessionCookieOptions(request.headers.get("host"));
  cookieStore.set(name, "", { ...options, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
