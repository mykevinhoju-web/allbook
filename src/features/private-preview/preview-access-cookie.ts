import { SignJWT, jwtVerify } from "jose";

export const PRIVATE_PREVIEW_ACCESS_COOKIE = "allbook_preview_access";

/** Secret unlock path — never link from nav or sitemap. */
export const PRIVATE_PREVIEW_UNLOCK_PATH =
  "/allbook-internal-preview-9X4K2P";

const PURPOSE = "private_preview_access";

function getSecret() {
  const value =
    process.env.APP_SESSION_SECRET ?? process.env.STAFF_SESSION_SECRET;
  if (!value) return null;
  return new TextEncoder().encode(value);
}

export async function signPreviewAccessToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("APP_SESSION_SECRET is required for preview access.");
    }
    return "preview-dev";
  }

  return new SignJWT({ purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
}

export async function verifyPreviewAccessToken(
  token: string | null | undefined,
): Promise<boolean> {
  if (!token) return false;

  const secret = getSecret();
  if (!secret) {
    return (
      process.env.NODE_ENV !== "production" && token === "preview-dev"
    );
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: "1 day",
    });
    return (payload as { purpose?: unknown }).purpose === PURPOSE;
  } catch {
    return false;
  }
}

export function getPreviewAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
