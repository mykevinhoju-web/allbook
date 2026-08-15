import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import { markStaffSessionOffline, clearStaffCurrentRoom } from "@/features/staff/lib/staff-presence";
import { expireNamedSessionCookie } from "@/lib/app-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";

/** Clear staff session only — room tablet claim stays. */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const token = readCookieFromRequest(request, getStaffSessionCookieName());
    const session = token ? await verifyStaffSession(token) : null;

    if (session?.tenantId === tenant.id) {
      const supabase = createServiceSupabase();
      await markStaffSessionOffline(supabase, {
        tenantId: tenant.id,
        staffId: session.staffId,
      });
      await clearStaffCurrentRoom(supabase, {
        tenantId: tenant.id,
        staffId: session.staffId,
      });
    }

    const response = NextResponse.json({ ok: true });
    expireNamedSessionCookie(
      response.cookies,
      getStaffSessionCookieName(),
      request.headers.get("host"),
    );
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
