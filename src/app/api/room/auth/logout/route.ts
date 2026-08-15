import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import { markStaffSessionOffline, clearStaffCurrentRoom } from "@/features/staff/lib/staff-presence";
import {
  getRoomSessionCookieName,
  verifyRoomSession,
} from "@/lib/room-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";

/** Release this tablet’s room claim and clear room + staff cookies. */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const token = readCookieFromRequest(request, getRoomSessionCookieName());
    const session = token ? await verifyRoomSession(token) : null;
    const staffToken = readCookieFromRequest(
      request,
      getStaffSessionCookieName(),
    );
    const staffSession = staffToken ? await verifyStaffSession(staffToken) : null;

    const supabase = createServiceSupabase();

    if (staffSession?.tenantId === tenant.id) {
      await markStaffSessionOffline(supabase, {
        tenantId: tenant.id,
        staffId: staffSession.staffId,
      });
      await clearStaffCurrentRoom(supabase, {
        tenantId: tenant.id,
        staffId: staffSession.staffId,
      });
    }

    if (session?.tenantId === tenant.id) {
      await supabase
        .from("rooms")
        .update({
          claimed_device_id: null,
          claimed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenant.id)
        .eq("id", session.roomId)
        .eq("claimed_device_id", session.deviceId);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.delete(getRoomSessionCookieName());
    response.cookies.delete(getStaffSessionCookieName());
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
