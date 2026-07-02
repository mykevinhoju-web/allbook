import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import type { Database } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    };

    const updates: Database["public"]["Tables"]["rooms"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder;

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("rooms")
      .update(updates)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select("id, name, sort_order, is_active, created_at, updated_at")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!data) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
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
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
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
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
