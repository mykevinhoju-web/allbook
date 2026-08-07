import { SignJWT, jwtVerify } from "jose";

const TENANT_TOKEN_PURPOSE = "tenant_slug";

function getSecret() {
  const value =
    process.env.APP_SESSION_SECRET ?? process.env.STAFF_SESSION_SECRET;
  if (!value) {
    // Dev fallback — unsigned slug only accepted in non-production below.
    return null;
  }
  return new TextEncoder().encode(value);
}

/** Sign a tenant slug for httpOnly cookie (verified mapping). */
export async function signTenantSlugToken(slug: string): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    return slug;
  }
  return new SignJWT({ slug, purpose: TENANT_TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret);
}

/** Verify cookie value → slug, or null if forged/invalid. */
export async function verifyTenantSlugToken(
  token: string | null | undefined,
): Promise<string | null> {
  if (!token) return null;

  const secret = getSecret();
  if (!secret) {
    // Non-production without secret: accept plain slug (local only).
    if (process.env.NODE_ENV === "production") return null;
    if (/^[a-z0-9-]+$/.test(token)) return token;
    return null;
  }

  // Legacy plain slug cookies are not trusted in production.
  if (!token.includes(".")) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: "1 day",
    });
    const record = payload as { slug?: unknown; purpose?: unknown };
    if (
      record.purpose !== TENANT_TOKEN_PURPOSE ||
      typeof record.slug !== "string" ||
      !/^[a-z0-9-]+$/.test(record.slug)
    ) {
      return null;
    }
    return record.slug;
  } catch {
    return null;
  }
}
