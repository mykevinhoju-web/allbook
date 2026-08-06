import { NextResponse } from "next/server";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getRoomSessionCookieName,
  verifyRoomSession,
} from "@/lib/room-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);

    let body: {
      tenantSlug?: string;
      endpoint?: string;
      p256dh?: string;
      auth?: string;
      userAgent?: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { endpoint, p256dh, auth, userAgent } = body;

    if (body.tenantSlug && body.tenantSlug !== tenant.slug) {
      return NextResponse.json({ error: "Invalid tenant." }, { status: 400 });
    }

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let audience: "admin" | "staff" | "room" = "admin";
    let staffId: string | null = null;
    let roomId: string | null = null;

    const roomToken = readCookieFromRequest(
      request,
      getRoomSessionCookieName(),
    );
    if (roomToken) {
      const roomPayload = await verifyRoomSession(roomToken);
      if (
        roomPayload &&
        roomPayload.role === "room" &&
        roomPayload.tenantId === tenant.id
      ) {
        audience = "room";
        roomId = roomPayload.roomId;
      }
    }

    if (audience !== "room") {
      const token = readCookieFromRequest(
        request,
        getStaffSessionCookieName(),
      );
      if (token) {
        const payload = await verifyStaffSession(token);
        if (
          payload &&
          payload.role === "staff" &&
          payload.tenantId === tenant.id
        ) {
          audience = "staff";
          staffId = payload.staffId;
        }
      }
    }

    const supabase = createServiceSupabase();

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        tenant_slug: tenant.slug,
        endpoint,
        p256dh,
        auth,
        audience,
        staff_id: staffId,
        room_id: roomId,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: "Run supabase/setup.sql to create push_subscriptions table.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true });
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
