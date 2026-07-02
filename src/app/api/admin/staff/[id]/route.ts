import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  parseStaffAttributes,
  toStaffAttributesJson,
  type StaffAttributes,
} from "@/features/staff/utils/attributes";
import type { StaffStatus } from "@/features/staff/types";

const STAFF_SELECT =
  "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order, created_at, updated_at";

function mapStaffRow(
  row: {
    id: string;
    name: string;
    status: string;
    attributes: unknown;
    working_days: string[];
    working_hours_start: string;
    working_hours_end: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  },
  photos: { id: string; url: string; sort_order: number }[],
) {
  return {
    id: row.id,
    name: row.name,
    status: row.status as StaffStatus,
    attributes: parseStaffAttributes(row.attributes as never),
    workingDays: row.working_days,
    workingHoursStart: row.working_hours_start.slice(0, 5),
    workingHoursEnd: row.working_hours_end.slice(0, 5),
    sortOrder: row.sort_order,
    photos: photos
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        sortOrder: photo.sort_order,
      })),
    photoUrl: photos.find((p) => p.sort_order === 0)?.url ?? photos[0]?.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("staff")
      .select(STAFF_SELECT)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!data) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { data: photos } = await supabase
      .from("staff_photos")
      .select("id, url, sort_order")
      .eq("staff_id", id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({
      staff: mapStaffRow(data, photos ?? []),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      status?: StaffStatus;
      attributes?: StaffAttributes;
      workingDays?: string[];
      workingHoursStart?: string;
      workingHoursEnd?: string;
    };

    const supabase = createServiceSupabase();
    const updates: Database["public"]["Tables"]["staff"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.status !== undefined) updates.status = body.status;
    if (body.attributes !== undefined) {
      updates.attributes = toStaffAttributesJson(body.attributes);
    }
    if (body.workingDays !== undefined) updates.working_days = body.workingDays;
    if (body.workingHoursStart !== undefined) {
      updates.working_hours_start = body.workingHoursStart;
    }
    if (body.workingHoursEnd !== undefined) {
      updates.working_hours_end = body.workingHoursEnd;
    }

    const { data, error } = await supabase
      .from("staff")
      .update(updates)
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .select(STAFF_SELECT)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    if (!data) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const { data: photos } = await supabase
      .from("staff_photos")
      .select("id, url, sort_order")
      .eq("staff_id", id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({
      staff: mapStaffRow(data, photos ?? []),
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
      .from("staff")
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
