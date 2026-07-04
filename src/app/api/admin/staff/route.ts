import { NextResponse } from "next/server";

import {
  dayCodeForDate,
  datetimeLocalToIso,
  isoToDatetimeLocal,
  defaultShiftWindow,
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

function deriveWorkingFields(shiftStartsAtLocal: string, shiftEndsAtLocal: string) {
  const start = new Date(shiftStartsAtLocal);
  const end = new Date(shiftEndsAtLocal);
  const days = new Set<string>();
  const cursor = new Date(start);
  cursor.setHours(12, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(12, 0, 0, 0);

  while (cursor.getTime() <= endDay.getTime()) {
    days.add(dayCodeForDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  const startTime = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;

  return {
    workingDays: [...days],
    workingHoursStart: startTime,
    workingHoursEnd: endTime === startTime ? "23:59" : endTime,
  };
}

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();

    const { data: staffRows, error } = await supabase
      .from("staff")
      .select(
        "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order, created_at, updated_at",
      )
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const staffIds = staffRows?.map((row) => row.id) ?? [];
    let photos: { id: string; staff_id: string; url: string; sort_order: number }[] =
      [];

    if (staffIds.length > 0) {
      const { data: photoRows } = await supabase
        .from("staff_photos")
        .select("id, staff_id, url, sort_order")
        .in("staff_id", staffIds);

      photos = photoRows ?? [];
    }

    const staff = (staffRows ?? []).map((row) =>
      mapStaffRow(
        row,
        photos.filter((photo) => photo.staff_id === row.id),
      ),
    );

    return NextResponse.json({ staff });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      name?: string;
      status?: StaffStatus;
      attributes?: StaffAttributes;
      shiftStartsAt?: string;
      shiftEndsAt?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const fallback = defaultShiftWindow();
    const shiftStartsAtLocal = body.shiftStartsAt ?? fallback.shiftStartsAt;
    const shiftEndsAtLocal = body.shiftEndsAt ?? fallback.shiftEndsAt;
    const startIso = datetimeLocalToIso(shiftStartsAtLocal);
    const endIso = datetimeLocalToIso(shiftEndsAtLocal);

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      return NextResponse.json(
        { error: "Available until must be after available from." },
        { status: 400 },
      );
    }

    const derived = deriveWorkingFields(shiftStartsAtLocal, shiftEndsAtLocal);
    const attributes: StaffAttributes = {
      ...(body.attributes ?? {}),
      shiftStartsAt: startIso,
      shiftEndsAt: endIso,
    };

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("staff")
      .insert({
        tenant_id: tenant.id,
        name: body.name.trim(),
        status: body.status ?? "active",
        attributes: toStaffAttributesJson(attributes),
        working_days: derived.workingDays,
        working_hours_start: derived.workingHoursStart,
        working_hours_end: derived.workingHoursEnd,
      })
      .select(
        "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create staff." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      staff: mapStaffRow(data, []),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
