import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "allbook_admin_session";
export const STAFF_SESSION_COOKIE = "allbook_staff_session";

/** ~10 years — sessions last until explicit logout. */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export type AdminSessionPayload = {
  role: "admin";
  tenantSlug: string;
  tenantId: string;
  adminId: string;
  loginId: string;
};

export type StaffSessionPayload = {
  role: "staff";
  tenantSlug: string;
  tenantId: string;
  staffId: string;
  loginId: string;
};

export type AppSessionPayload = AdminSessionPayload | StaffSessionPayload;

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

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  };
}

export async function signAppSession(payload: AppSessionPayload) {
  const secret = getSecret();
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret);
}

export async function verifyAppSession(
  token: string,
): Promise<AppSessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: "1 day",
    });
    const record = payload as unknown as AppSessionPayload;
    if (record.role !== "admin" && record.role !== "staff") {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}
