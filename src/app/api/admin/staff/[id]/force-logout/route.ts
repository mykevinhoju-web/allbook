import { NextResponse } from "next/server";

import {
  clearStaffCurrentRoom,
  markStaffSessionOffline,
  STAFF_CURRENT_ROOM_KEY,
} from "@/features/staff/lib/staff-presence";
import { parseStaffAttributes } from "@/features/staff/utils/attributes";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

/**
 * Admin force-clears a staff PIN room session:
 * - offline presence (session_started_at / last_seen_at)
 * - sticky Room badge (attributes.currentRoomName)
 * - tablet claim on that room (so another tablet can sign in)
 *
 * Does not end an active in-service booking — refuse instead.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id: staffId } = await params;
    const supabase = createServiceSupabase();

    const { data: staff, error: staffError } = await supabase
      .from("staff")
      .select("id, name, attributes")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }
    if (!staff) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { data: activeBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .not("checked_in_at", "is", null)
      .is("checked_out_at", null)
      .neq("status", "cancelled")
      .neq("status", "completed")
      .limit(1)
      .maybeSingle();

    if (activeBooking) {
      return NextResponse.json(
        {
          error:
            "This staff member is still in service. Check them out first, then clear the room login.",
          code: "STAFF_IN_SERVICE",
        },
        { status: 409 },
      );
    }

    const attributes = parseStaffAttributes((staff.attributes ?? {}) as never);
    const roomNameRaw = attributes[STAFF_CURRENT_ROOM_KEY];
    const roomName =
      typeof roomNameRaw === "string" && roomNameRaw.trim()
        ? roomNameRaw.trim()
        : null;

    await markStaffSessionOffline(supabase, {
      tenantId: tenant.id,
      staffId,
    });
    await clearStaffCurrentRoom(supabase, {
      tenantId: tenant.id,
      staffId,
    });

    let tabletReleased = false;
    if (roomName) {
      const now = new Date().toISOString();
      const { data: room } = await supabase
        .from("rooms")
        .select("id, claimed_device_id")
        .eq("tenant_id", tenant.id)
        .eq("name", roomName)
        .maybeSingle();

      if (room?.claimed_device_id) {
        const { error: releaseError } = await supabase
          .from("rooms")
          .update({
            claimed_device_id: null,
            claimed_at: null,
            updated_at: now,
          })
          .eq("tenant_id", tenant.id)
          .eq("id", room.id);

        if (!releaseError) {
          tabletReleased = true;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      staffId,
      staffName: staff.name,
      clearedRoomName: roomName,
      tabletReleased,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
