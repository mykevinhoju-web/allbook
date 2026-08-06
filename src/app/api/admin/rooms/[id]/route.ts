import { NextResponse } from "next/server";

import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import type { Database } from "@/types/database";

async function normalizeRoomSortOrders(supabase: ReturnType<typeof createServiceSupabase>, tenantId: string) {
  const { data } = await supabase
    .from("rooms")
    .select("id, sort_order, updated_at")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: true });

  if (!data?.length) return;

  // Ensure unique stable 1..N ordering (prevents duplicate sort_order causing nondeterministic priority).
  const now = new Date().toISOString();
  for (const [idx, room] of data.entries()) {
    await supabase
      .from("rooms")
      .update({ sort_order: idx + 1, updated_at: now })
      .eq("tenant_id", tenantId)
      .eq("id", room.id);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
      releaseTabletClaim?: boolean;
    };

    const updates: Database["public"]["Tables"]["rooms"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;
    if (body.releaseTabletClaim) {
      updates.claimed_device_id = null;
      updates.claimed_at = null;
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(
        "id, name, sort_order, is_active, claimed_device_id, claimed_at, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!data) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    if (body.sortOrder !== undefined) {
      await normalizeRoomSortOrders(supabase, tenant.id);
    }

    return NextResponse.json({
      room: {
        id: data.id,
        name: data.name,
        sortOrder: data.sort_order,
        isActive: data.is_active,
        tabletClaimed: Boolean(data.claimed_device_id),
        claimedAt: data.claimed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
