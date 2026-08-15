import { NextResponse } from "next/server";

import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import { createServiceSupabase } from "@/lib/supabase/service";
import { markStaffSessionOffline, clearStaffCurrentRoom } from "@/features/staff/lib/staff-presence";
import {
  getStaffSessionCookieName,
  getStaffSessionCookieOptions,
  verifyStaffSession,
} from "@/lib/staff-session";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";

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
    const options = {
      ...getStaffSessionCookieOptions(request.headers.get("host")),
      maxAge: 0,
    };
    response.cookies.set(getStaffSessionCookieName(), "", options);
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
