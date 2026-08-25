import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getRoomSessionCookieName,
  getRoomSessionCookieOptions,
  signRoomSession,
  verifyRoomSession,
} from "@/lib/room-session";
import { getStaffSessionCookieName } from "@/lib/staff-session";
import { expireNamedSessionCookie } from "@/lib/app-session";

/** Claim a room for this tablet (no password). Rejects duplicate claims. */
export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      roomId?: string;
      force?: boolean;
      deviceId?: string;
    };

    if (!body.roomId) {
      return NextResponse.json({ error: "roomId is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id, name, is_active, claimed_device_id, claimed_at")
      .eq("tenant_id", tenant.id)
      .eq("id", body.roomId)
      .maybeSingle();

    if (roomError) {
      return NextResponse.json({ error: roomError.message }, { status: 503 });
    }
    if (!room || !room.is_active) {
      return NextResponse.json({ error: "Room not available." }, { status: 404 });
    }

    const existingToken = readCookieFromRequest(
      request,
      getRoomSessionCookieName(),
    );
    const existingSession = existingToken
      ? await verifyRoomSession(existingToken)
      : null;

    const requestedDeviceId =
      typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    const deviceId =
      (existingSession?.tenantId === tenant.id
        ? existingSession.deviceId
        : null) ||
      requestedDeviceId ||
      randomUUID();

    const claimedByOther =
      Boolean(room.claimed_device_id) &&
      room.claimed_device_id !== deviceId;

    if (claimedByOther && !body.force) {
      return NextResponse.json(
        {
          error: "This room is already signed in on another tablet.",
          code: "ROOM_CLAIMED",
        },
        { status: 409 },
      );
    }

    if (
      existingSession?.tenantId === tenant.id &&
      existingSession.roomId !== room.id
    ) {
      await supabase
        .from("rooms")
        .update({
          claimed_device_id: null,
          claimed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenant.id)
        .eq("id", existingSession.roomId)
        .eq("claimed_device_id", existingSession.deviceId);
    }

    const now = new Date().toISOString();
    const { error: claimError } = await supabase
      .from("rooms")
      .update({
        claimed_device_id: deviceId,
        claimed_at: now,
        updated_at: now,
      })
      .eq("tenant_id", tenant.id)
      .eq("id", room.id);

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 503 });
    }

    const token = await signRoomSession({
      role: "room",
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      roomId: room.id,
      roomName: room.name,
      deviceId,
    });

    const response = NextResponse.json({
      ok: true,
      room: { id: room.id, name: room.name },
      deviceId,
    });
    response.cookies.set(
      getRoomSessionCookieName(),
      token,
      getRoomSessionCookieOptions(request.headers.get("host")),
    );
    expireNamedSessionCookie(
      response,
      getStaffSessionCookieName(),
      request.headers.get("host"),
    );
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("APP_SESSION_SECRET")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
