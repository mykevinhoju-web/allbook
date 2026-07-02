import {
  ADMIN_SESSION_COOKIE,
  getSessionCookieOptions,
  signAppSession,
  verifyAppSession,
  type AdminSessionPayload,
} from "./app-session";

export type { AdminSessionPayload };

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}

export { getSessionCookieOptions as getAdminSessionCookieOptions };

export async function signAdminSession(payload: AdminSessionPayload) {
  return signAppSession(payload);
}

export async function verifyAdminSession(token: string) {
  const session = await verifyAppSession(token);
  if (!session || session.role !== "admin") {
    return null;
  }
  return session;
}
