import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_TIMEZONE,
  DEFAULT_WORKING_HOURS_END,
  DEFAULT_WORKING_HOURS_START,
} from "@/features/booking/lib/schedule-utils";
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
import {
  ALL_WEEKDAY_CODES,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
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
      mapStaffRow(row, photos.filter((photo) => photo.staff_id === row.id)),
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
      daySchedule?: Record<string, boolean>;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const attributes: StaffAttributes = {
      ...(body.attributes ?? {}),
    };

    if (body.daySchedule) {
      attributes.daySchedule = {
        ...parseDaySchedule(body.daySchedule),
      };
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("staff")
      .insert({
        tenant_id: tenant.id,
        name: body.name.trim(),
        status: body.status ?? "active",
        attributes: toStaffAttributesJson(attributes),
        working_days: [...ALL_WEEKDAY_CODES],
        working_hours_start: DEFAULT_WORKING_HOURS_START,
        working_hours_end: DEFAULT_WORKING_HOURS_END,
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
      staff: mapStaffRow(data, []),
      timeZone,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
