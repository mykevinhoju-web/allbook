import { SignJWT, jwtVerify } from "jose";

import {
  getSessionCookieOptions,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/app-session";

export const PLATFORM_SESSION_COOKIE = "allbook_platform_session";

export type PlatformAdminSessionPayload = {
  role: "platform_admin";
  loginId: string;
};

function getSecret() {
  const value =
    process.env.APP_SESSION_SECRET ?? process.env.STAFF_SESSION_SECRET;
  if (!value) {
    throw new Error(
      "APP_SESSION_SECRET (or STAFF_SESSION_SECRET) is not configured.",
    );
  }
  return new TextEncoder().encode(value);
}

export function getPlatformSessionCookieName() {
  return PLATFORM_SESSION_COOKIE;
}

export function getPlatformSessionCookieOptions(host?: string | null) {
  return getSessionCookieOptions(host);
}

export async function signPlatformSession(
  payload: PlatformAdminSessionPayload,
) {
  const secret = getSecret();
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret);
}

export async function verifyPlatformSession(token: string) {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: "1 day",
    });
    const record = payload as unknown as PlatformAdminSessionPayload;
    if (record.role !== "platform_admin" || !record.loginId) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_MAX_AGE };
