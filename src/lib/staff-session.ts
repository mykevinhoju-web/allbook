import {
  getSessionCookieOptions,
  signAppSession,
  STAFF_SESSION_COOKIE,
  verifyAppSession,
  type StaffSessionPayload,
} from "./app-session";

export type { StaffSessionPayload };

export function getStaffSessionCookieName() {
  return STAFF_SESSION_COOKIE;
}

export { getSessionCookieOptions as getStaffSessionCookieOptions };

export async function signStaffSession(payload: StaffSessionPayload) {
  return signAppSession(payload);
}

export async function verifyStaffSession(token: string) {
  const session = await verifyAppSession(token);
  if (!session || session.role !== "staff") {
    return null;
  }
  return session;
}
