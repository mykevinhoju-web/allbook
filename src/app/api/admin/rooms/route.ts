import { NextResponse } from "next/server";

import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("rooms")
      .select(
        "id, name, sort_order, is_active, claimed_device_id, claimed_at, created_at, updated_at",
      )
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      rooms: (data ?? []).map((room) => ({
        id: room.id,
        name: room.name,
        sortOrder: room.sort_order,
        isActive: room.is_active,
        tabletClaimed: Boolean(room.claimed_device_id),
        claimedAt: room.claimed_at,
        createdAt: room.created_at,
        updatedAt: room.updated_at,
      })),
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const body = (await request.json()) as { name?: string };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Room name is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const { count } = await supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        tenant_id: tenant.id,
        name: body.name.trim(),
        sort_order: (count ?? 0) + 1,
      })
      .select("id, name, sort_order, is_active, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create room." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      room: {
        id: data.id,
        name: data.name,
        sortOrder: data.sort_order,
        isActive: data.is_active,
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
