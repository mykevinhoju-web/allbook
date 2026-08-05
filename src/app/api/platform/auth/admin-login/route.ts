import { NextResponse } from "next/server";

import {
  getPlatformSessionCookieName,
  getPlatformSessionCookieOptions,
  signPlatformSession,
} from "@/lib/platform-session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      loginId?: string;
      password?: string;
    };

    const envLoginId = process.env.PLATFORM_ADMIN_LOGIN_ID?.trim();
    const envPassword = process.env.PLATFORM_ADMIN_PASSWORD;

    if (!envLoginId || !envPassword) {
      return NextResponse.json(
        {
          error:
            "AllBook Admin login is not configured (PLATFORM_ADMIN_LOGIN_ID / PLATFORM_ADMIN_PASSWORD).",
        },
        { status: 503 },
      );
    }

    if (
      body.loginId?.trim() !== envLoginId ||
      body.password !== envPassword
    ) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signPlatformSession({
      role: "platform_admin",
      loginId: envLoginId,
    });

    const response = NextResponse.json({ ok: true, redirectTo: "/platform" });
    response.cookies.set(
      getPlatformSessionCookieName(),
      token,
      getPlatformSessionCookieOptions(request.headers.get("host")),
    );
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
