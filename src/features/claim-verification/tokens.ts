import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Hash a one-time verification secret. Never store plaintext. */
export function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateVerificationToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateNumericOtp(digits = 6): string {
  const max = 10 ** digits;
  const n = randomBytes(4).readUInt32BE(0) % max;
  return String(n).padStart(digits, "0");
}

export function tokensEqual(
  aHash: string,
  bPlainOrHash: string,
  plain = true,
): boolean {
  const bHash = plain ? hashVerificationToken(bPlainOrHash) : bPlainOrHash;
  const a = Buffer.from(aHash, "utf8");
  const b = Buffer.from(bHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
