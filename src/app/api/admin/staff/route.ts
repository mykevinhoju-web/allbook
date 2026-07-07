import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_TIMEZONE,
  datetimeLocalToIso,
  isoToDatetimeLocal,
  defaultShiftWindow,
  normalizeShiftWindow,
  toDatetimeLocalValue,
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
import {
  deriveWorkingFieldsFromPlan,
  parseShiftPlan,
} from "@/features/staff/utils/shift-plan";
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
  timeZone: string,
) {
  const attributes = parseStaffAttributes(row.attributes as never);
  const shift = getShiftWindowFromAttributes(attributes);
  const fallback = defaultShiftWindow(new Date(), timeZone);
  const localNow = toDatetimeLocalValue(new Date(), timeZone);
  const normalized = normalizeShiftWindow(
    shift.shiftStartsAt
      ? isoToDatetimeLocal(shift.shiftStartsAt, timeZone)
      : fallback.shiftStartsAt,
    shift.shiftEndsAt
      ? isoToDatetimeLocal(shift.shiftEndsAt, timeZone)
      : fallback.shiftEndsAt,
    localNow,
    timeZone,
  );

  return {
    id: row.id,
    name: row.name,
    status: row.status as StaffStatus,
    attributes,
    workingDays: row.working_days,
    workingHoursStart: row.working_hours_start.slice(0, 5),
    workingHoursEnd: row.working_hours_end.slice(0, 5),
    shiftStartsAt: normalized.shiftStartsAt,
    shiftEndsAt: normalized.shiftEndsAt,
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

function dayCodeInZone(dateStr: string, timeZone: string): string {
  const iso = datetimeLocalToIso(`${dateStr}T12:00`, timeZone);
  return new Date(iso)
    .toLocaleDateString("en-US", {
      timeZone,
      weekday: "short",
    })
    .toLowerCase()
    .slice(0, 3);
}

function deriveWorkingFields(
  shiftStartsAtLocal: string,
  shiftEndsAtLocal: string,
  timeZone: string,
) {
  const startDate = shiftStartsAtLocal.slice(0, 10);
  const endDate = shiftEndsAtLocal.slice(0, 10);
  const days = new Set<string>();

  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    const dateStr = cursor.toISOString().slice(0, 10);
    days.add(dayCodeInZone(dateStr, timeZone));
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

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const staff = (staffRows ?? []).map((row) =>
      mapStaffRow(
        row,
        photos.filter((photo) => photo.staff_id === row.id),
        timeZone,
      ),
    );

    return NextResponse.json({ staff, timeZone });
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

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const fallback = defaultShiftWindow(new Date(), timeZone);
    const incomingPlan = parseShiftPlan(body.attributes?.shiftPlan);
    const shiftStartsAtLocal = body.shiftStartsAt ?? fallback.shiftStartsAt;
    const shiftEndsAtLocal = body.shiftEndsAt ?? fallback.shiftEndsAt;
    const startIso = datetimeLocalToIso(shiftStartsAtLocal, timeZone);
    const endIso = datetimeLocalToIso(shiftEndsAtLocal, timeZone);

    if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
      return NextResponse.json(
        { error: "Available until must be after available from." },
        { status: 400 },
      );
    }

    const derived =
      Object.keys(incomingPlan).length > 0
        ? deriveWorkingFieldsFromPlan(incomingPlan, (dateStr) =>
            dayCodeInZone(dateStr, timeZone),
          )
        : deriveWorkingFields(
            shiftStartsAtLocal,
            shiftEndsAtLocal,
            timeZone,
          );
    const attributes: StaffAttributes = {
      ...(body.attributes ?? {}),
      shiftStartsAt: startIso,
      shiftEndsAt: endIso,
      shiftPlan:
        Object.keys(incomingPlan).length > 0
          ? incomingPlan
          : body.attributes?.shiftPlan,
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

    revalidateTag("booking-staff");

    return NextResponse.json({
      staff: mapStaffRow(data, [], timeZone),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
