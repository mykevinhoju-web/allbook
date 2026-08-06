import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getRoomSessionCookieName,
  verifyRoomSession,
} from "@/lib/room-session";

/** List active rooms for tablet room selection (shows claim status). */
export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();

    const existingToken = readCookieFromRequest(
      request,
      getRoomSessionCookieName(),
    );
    const existingSession = existingToken
      ? await verifyRoomSession(existingToken)
      : null;
    const thisDeviceId =
      existingSession?.tenantId === tenant.id ? existingSession.deviceId : null;

    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, sort_order, is_active, claimed_device_id, claimed_at")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      rooms: (data ?? []).map((room) => {
        const claimedByOther =
          Boolean(room.claimed_device_id) &&
          room.claimed_device_id !== thisDeviceId;
        const claimedByThis =
          Boolean(room.claimed_device_id) &&
          room.claimed_device_id === thisDeviceId;
        return {
          id: room.id,
          name: room.name,
          sortOrder: room.sort_order,
          claimed: Boolean(room.claimed_device_id),
          claimedByThis,
          available: !claimedByOther,
          claimedAt: room.claimed_at,
        };
      }),
      currentRoomId:
        existingSession?.tenantId === tenant.id ? existingSession.roomId : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
