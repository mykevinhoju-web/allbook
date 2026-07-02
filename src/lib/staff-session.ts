import { SignJWT, jwtVerify } from "jose";

export type StaffSessionPayload = {
  tenantSlug: string;
  tenantId: string;
  staffId: string;
  role: "staff";
};

const COOKIE_NAME = "allbook_staff_session";

function getSecret() {
  const value = process.env.STAFF_SESSION_SECRET;
  if (!value) {
    throw new Error("STAFF_SESSION_SECRET is not configured.");
  }
  return new TextEncoder().encode(value);
}

export function getStaffSessionCookieName() {
  return COOKIE_NAME;
}

export async function signStaffSession(payload: StaffSessionPayload) {
  const secret = getSecret();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyStaffSession(token: string) {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as StaffSessionPayload;
}

