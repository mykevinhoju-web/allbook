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

export function getSessionCookieOptions(host?: string | null) {
  const options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  };

  const hostname = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "allbook.com.au" || hostname.endsWith(".allbook.com.au")) {
    options.domain = ".allbook.com.au";
  }

  return options;
}

export function getExpiredSessionCookieOptions(host?: string | null) {
  return {
    ...getSessionCookieOptions(host),
    maxAge: 0,
  };
}

function expireCookieHeader(
  name: string,
  args: { domain?: string; secure: boolean },
): string {
  const parts = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (args.secure) parts.push("Secure");
  if (args.domain) parts.push(`Domain=${args.domain}`);
  return parts.join("; ");
}

/** Expire a cookie under every domain/secure variant this app may have set. */
export function expireNamedSessionCookie(
  response: { headers: Headers; cookies: { delete: (name: string) => unknown } },
  name: string,
  host?: string | null,
) {
  const hostname = (host ?? "").split(":")[0]?.toLowerCase() ?? "";
  const variants: { domain?: string; secure: boolean }[] = [
    { secure: true },
    { secure: false },
  ];
  if (hostname) {
    variants.push({ domain: hostname, secure: true });
    variants.push({ domain: hostname, secure: false });
  }
  if (hostname === "allbook.com.au" || hostname.endsWith(".allbook.com.au")) {
    variants.push({ domain: ".allbook.com.au", secure: true });
    variants.push({ domain: ".allbook.com.au", secure: false });
  }

  for (const variant of variants) {
    response.headers.append("Set-Cookie", expireCookieHeader(name, variant));
  }
  response.cookies.delete(name);
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
