import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import {
  BOOKING_TIMEZONE,
  datetimeLocalToIso,
  defaultShiftWindow,
  isoToDatetimeLocal,
} from "@/features/booking/lib/schedule-utils";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  getShiftWindowFromAttributes,
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
  const attributes = parseStaffAttributes(row.attributes as never);
  const shift = getShiftWindowFromAttributes(attributes);
  const fallback = defaultShiftWindow();

  return {
    id: row.id,
    name: row.name,
    status: row.status as StaffStatus,
    attributes,
    workingDays: row.working_days,
    workingHoursStart: row.working_hours_start.slice(0, 5),
    workingHoursEnd: row.working_hours_end.slice(0, 5),
    shiftStartsAt: shift.shiftStartsAt
      ? isoToDatetimeLocal(shift.shiftStartsAt)
      : fallback.shiftStartsAt,
    shiftEndsAt: shift.shiftEndsAt
      ? isoToDatetimeLocal(shift.shiftEndsAt)
      : fallback.shiftEndsAt,
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

function brisbaneDayCode(dateStr: string): string {
  const iso = datetimeLocalToIso(`${dateStr}T12:00`);
  return new Date(iso)
    .toLocaleDateString("en-US", {
      timeZone: BOOKING_TIMEZONE,
      weekday: "short",
    })
    .toLowerCase()
    .slice(0, 3);
}

function deriveWorkingFields(shiftStartsAtLocal: string, shiftEndsAtLocal: string) {
  const startDate = shiftStartsAtLocal.slice(0, 10);
  const endDate = shiftEndsAtLocal.slice(0, 10);
  const days = new Set<string>();

  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    const dateStr = cursor.toISOString().slice(0, 10);
    days.add(brisbaneDayCode(dateStr));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const startTime = shiftStartsAtLocal.slice(11, 16);
  const endTime = shiftEndsAtLocal.slice(11, 16);

  return {
    workingDays: [...days],
    workingHoursStart: startTime,
    workingHoursEnd: endTime === startTime ? "23:59" : endTime,
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
      shiftStartsAt?: string;
      shiftEndsAt?: string;
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

    if (body.shiftStartsAt !== undefined || body.shiftEndsAt !== undefined) {
      const fallback = defaultShiftWindow();
      const shiftStartsAtLocal =
        body.shiftStartsAt ??
        (current.shiftStartsAt
          ? isoToDatetimeLocal(current.shiftStartsAt)
          : fallback.shiftStartsAt);
      const shiftEndsAtLocal =
        body.shiftEndsAt ??
        (current.shiftEndsAt
          ? isoToDatetimeLocal(current.shiftEndsAt)
          : fallback.shiftEndsAt);

      const startIso = datetimeLocalToIso(shiftStartsAtLocal);
      const endIso = datetimeLocalToIso(shiftEndsAtLocal);

      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        return NextResponse.json(
          { error: "Available until must be after available from." },
          { status: 400 },
        );
      }

      next.shiftStartsAt = startIso;
      next.shiftEndsAt = endIso;

      const derived = deriveWorkingFields(shiftStartsAtLocal, shiftEndsAtLocal);
      updates.working_days = derived.workingDays;
      updates.working_hours_start = derived.workingHoursStart;
      updates.working_hours_end = derived.workingHoursEnd;
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
