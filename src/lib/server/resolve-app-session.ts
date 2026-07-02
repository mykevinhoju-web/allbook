import { cookies } from "next/headers";

import {
  verifyAdminSession,
  getAdminSessionCookieName,
} from "@/lib/admin-session";
import {
  verifyStaffSession,
  getStaffSessionCookieName,
} from "@/lib/staff-session";
import type { AppSessionPayload } from "@/lib/app-session";

export async function resolveAppSession(): Promise<AppSessionPayload | null> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(getAdminSessionCookieName())?.value;
  if (adminToken) {
    const admin = await verifyAdminSession(adminToken);
    if (admin) return admin;
  }

  const staffToken = cookieStore.get(getStaffSessionCookieName())?.value;
  if (staffToken) {
    const staff = await verifyStaffSession(staffToken);
    if (staff) return staff;
  }

  return null;
}
