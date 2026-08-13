import { SignJWT, jwtVerify } from "jose";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";

import { getSessionCookieOptions } from "./app-session";

export const ADMIN_REPORTS_UNLOCK_COOKIE = "allbook_admin_reports";
/** Unlock lasts 10 minutes while staying on Reports. */
export const ADMIN_REPORTS_UNLOCK_MAX_AGE = 10 * 60;

export type AdminReportsUnlockPayload = {
  purpose: "admin-reports";
  tenantId: string;
  adminId: string;
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

export function getAdminReportsUnlockCookieName() {
  return ADMIN_REPORTS_UNLOCK_COOKIE;
}

export function getAdminReportsUnlockCookieOptions(host?: string | null) {
  return {
    ...getSessionCookieOptions(host),
    maxAge: ADMIN_REPORTS_UNLOCK_MAX_AGE,
  };
}

export async function signAdminReportsUnlock(
  payload: AdminReportsUnlockPayload,
) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_REPORTS_UNLOCK_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyAdminReportsUnlock(
  token: string,
): Promise<AdminReportsUnlockPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const record = payload as unknown as AdminReportsUnlockPayload;
    if (
      record.purpose !== "admin-reports" ||
      !record.tenantId ||
      !record.adminId
    ) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export async function isAdminReportsUnlocked(
  request: Request,
  args: { tenantId: string; adminId: string },
): Promise<boolean> {
  const token = readCookieFromRequest(
    request,
    getAdminReportsUnlockCookieName(),
  );
  if (!token) return false;
  const payload = await verifyAdminReportsUnlock(token);
  return (
    payload?.tenantId === args.tenantId && payload.adminId === args.adminId
  );
}
