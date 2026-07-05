import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/booking/lib/schedule-utils";
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
import { parseDaySchedule } from "@/features/staff/utils/day-schedule";
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
  const attributes = parseStaffAttributes(row.attributes as never);

  return {
    id: row.id,
    name: row.name,
    status: row.status as StaffStatus,
    attributes,
    daySchedule: parseDaySchedule(attributes.daySchedule),
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

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;

    return NextResponse.json({
      staff: mapStaffRow(data, photos ?? []),
      timeZone,
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
      daySchedule?: Record<string, boolean>;
    };

    const supabase = createServiceSupabase();

    const { data: existing, error: existingError } = await supabase
      .from("staff")
      .select("attributes")
      .eq("tenant_id", tenant.id)
      .eq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 503 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const updates: Database["public"]["Tables"]["staff"]["Update"] = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.status !== undefined) updates.status = body.status;

    const current = parseStaffAttributes(existing.attributes as never);
    const next: StaffAttributes = {
      ...current,
      ...(body.attributes ?? {}),
    };

    if (body.daySchedule !== undefined) {
      next.daySchedule = {
        ...parseDaySchedule(current.daySchedule),
        ...parseDaySchedule(body.daySchedule),
      };
    }

    updates.attributes = toStaffAttributesJson(next);

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

    revalidateTag("booking-staff");

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;

    return NextResponse.json({
      staff: mapStaffRow(data, photos ?? []),
      timeZone,
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

    revalidateTag("booking-staff");

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
