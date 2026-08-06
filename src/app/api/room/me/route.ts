import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  RoomAuthError,
  requireRoomSession,
} from "@/lib/server/require-room-session";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const session = await requireRoomSession(tenant.id, request);
    const supabase = createServiceSupabase();

    const { data: room } = await supabase
      .from("rooms")
      .select("id, name, is_active, claimed_device_id")
      .eq("tenant_id", tenant.id)
      .eq("id", session.roomId)
      .maybeSingle();

    if (
      !room ||
      !room.is_active ||
      room.claimed_device_id !== session.deviceId
    ) {
      return NextResponse.json(
        {
          error:
            "Room login required first. Select this tablet’s room before staff PIN sign-in.",
          code: "ROOM_LOGIN_REQUIRED",
          user: null,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      user: {
        role: "room",
        roomId: room.id,
        roomName: room.name,
        deviceId: session.deviceId,
      },
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RoomAuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code, user: null },
        { status: error.status },
      );
    }
    throw error;
  }
}
