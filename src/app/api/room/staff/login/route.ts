import { NextResponse } from "next/server";

import { findRoomActiveService } from "@/features/booking/lib/staff-conflict";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { getAdminSessionCookieName } from "@/lib/admin-session";
import { findStaffAccountsByPin } from "@/lib/staff-pin-auth";
import { validateStaffPin } from "@/lib/staff-pin";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";
import {
  getStaffSessionCookieName,
  getStaffSessionCookieOptions,
  signStaffSession,
} from "@/lib/staff-session";
import { markStaffSessionOnline, setStaffCurrentRoom } from "@/features/staff/lib/staff-presence";

/**
 * Staff PIN login for room tablets.
 * Room session is mandatory — without it, staff cannot sign in here.
 */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const roomSession = await requireRoomSession(tenant.id, request);

    const body = (await request.json()) as { pin?: string };
    const pin = (body.pin ?? "").trim();
    const pinError = validateStaffPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const matches = await findStaffAccountsByPin(supabase, tenant.id, pin);

    if (matches.length === 0) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }
    if (matches.length > 1) {
      return NextResponse.json(
        {
          error:
            "This PIN matches more than one account. Ask your manager to assign a unique PIN.",
        },
        { status: 409 },
      );
    }

    const account = matches[0]!;

    const roomInService = await findRoomActiveService(
      supabase,
      tenant.id,
      roomSession.roomId,
    );
    if (roomInService && roomInService.staff_id !== account.staff_id) {
      return NextResponse.json(
        {
          error:
            "This room is already in service. Wait until that service ends, or use another room.",
          code: "ROOM_IN_SERVICE",
        },
        { status: 409 },
      );
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", account.staff_id)
      .maybeSingle();

    await markStaffSessionOnline(supabase, {
      tenantId: tenant.id,
      staffId: account.staff_id,
    });
    await setStaffCurrentRoom(supabase, {
      tenantId: tenant.id,
      staffId: account.staff_id,
      roomName: roomSession.roomName,
    });

    const token = await signStaffSession({
      role: "staff",
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      staffId: account.staff_id,
      loginId: account.login_id,
    });

    const response = NextResponse.json({
      ok: true,
      staff: { id: account.staff_id, name: staff?.name ?? "Staff" },
    });
    response.cookies.set(
      getStaffSessionCookieName(),
      token,
      getStaffSessionCookieOptions(request.headers.get("host")),
    );
    response.cookies.delete(getAdminSessionCookieName());
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RoomAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    throw error;
  }
}
