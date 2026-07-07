import { cookies } from "next/headers";

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
): Promise<StaffSessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getStaffSessionCookieName())?.value;

  if (!token) {
    throw new StaffAuthError("Unauthorized.");
  }

  const session = await verifyStaffSession(token);
  if (!session || session.tenantId !== tenantId) {
    throw new StaffAuthError("Unauthorized.");
  }

  return session;
}
