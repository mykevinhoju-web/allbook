import { cookies } from "next/headers";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
  type StaffSessionPayload,
} from "@/lib/staff-session";

export class StaffAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireStaffSession(
  tenantId: string,
  request?: Request,
): Promise<StaffSessionPayload> {
  const cookieName = getStaffSessionCookieName();
  const token = request
    ? readCookieFromRequest(request, cookieName)
    : (await cookies()).get(cookieName)?.value;

  if (!token) {
    throw new StaffAuthError("Unauthorized.");
  }

  const session = await verifyStaffSession(token);
  if (!session || session.tenantId !== tenantId) {
    throw new StaffAuthError("Unauthorized.");
  }

  return session;
}
