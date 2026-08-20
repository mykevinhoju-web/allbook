import { NextResponse } from "next/server";

import {
  setStaffCurrentRoom,
  touchStaffSessionPresence,
} from "@/features/staff/lib/staff-presence";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { expireNamedSessionCookie } from "@/lib/app-session";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import { getOptionalRoomSession } from "@/lib/server/require-room-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";

/**
 * Confirm staff PIN session for the room tablet and re-publish room presence
 * so admin Staff list stays accurate after refresh.
 * Admin force-logout clears session_started_at — this then drops the cookie.
 */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await getOptionalRoomSession(tenant.id, request);
    if (!roomSession) {
      return NextResponse.json(
        {
          error: "Room login required.",
          code: "ROOM_LOGIN_REQUIRED",
          staff: null,
        },
        { status: 403 },
      );
    }

    const token = readCookieFromRequest(request, getStaffSessionCookieName());
    if (!token) {
      return NextResponse.json({ staff: null });
    }

    const payload = await verifyStaffSession(token);
    if (
      !payload ||
      payload.role !== "staff" ||
      payload.tenantId !== tenant.id
    ) {
      const response = NextResponse.json({ staff: null });
      expireNamedSessionCookie(
        response,
        getStaffSessionCookieName(),
        request.headers.get("host"),
      );
      return response;
    }

    const supabase = createServiceSupabase();
    const [{ data: account }, { data: staff }] = await Promise.all([
      supabase
        .from("staff_accounts")
        .select("staff_id, session_started_at")
        .eq("tenant_id", tenant.id)
        .eq("staff_id", payload.staffId)
        .maybeSingle(),
      supabase
        .from("staff")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .eq("id", payload.staffId)
        .maybeSingle(),
    ]);

    if (!staff || !account?.session_started_at) {
      const response = NextResponse.json({ staff: null });
      expireNamedSessionCookie(
        response,
        getStaffSessionCookieName(),
        request.headers.get("host"),
      );
      return response;
    }

    await touchStaffSessionPresence(supabase, {
      tenantId: tenant.id,
      staffId: staff.id,
    });
    await setStaffCurrentRoom(supabase, {
      tenantId: tenant.id,
      staffId: staff.id,
      roomName: roomSession.roomName,
    });

    return NextResponse.json({
      staff: { id: staff.id, name: staff.name },
      roomName: roomSession.roomName,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
