import { NextResponse } from "next/server";

import {
  getPlatformSessionCookieName,
  getPlatformSessionCookieOptions,
} from "@/lib/platform-session";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getPlatformSessionCookieName(), "", {
    ...getPlatformSessionCookieOptions(request.headers.get("host")),
    maxAge: 0,
  });
  return response;
}
