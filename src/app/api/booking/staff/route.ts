import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { parseStaffAttributes } from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import {
  DEFAULT_BOOKING_TIMEZONE,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";

const getBookingStaffForTenant = unstable_cache(
  async (tenantId: string, currency: string) => {
    const supabase = createServiceSupabase();

    const { data: staffRows, error } = await supabase
      .from("staff")
      .select(
        "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order",
      )
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const staffIds = staffRows?.map((row) => row.id) ?? [];
    const photoByStaffId = new Map<string, string>();

    if (staffIds.length > 0) {
      const { data: photoRows } = await supabase
        .from("staff_photos")
        .select("staff_id, url, sort_order")
        .in("staff_id", staffIds)
        .order("sort_order", { ascending: true });

      for (const photo of photoRows ?? []) {
        if (!photoByStaffId.has(photo.staff_id)) {
          photoByStaffId.set(photo.staff_id, photo.url);
        }
      }
    }

    const staff = (staffRows ?? []).map((row) => {
      const attributes = parseStaffAttributes(row.attributes as never);
      const initials = row.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return {
        id: row.id,
        name: row.name,
        role:
          (typeof attributes.introduction === "string" &&
          attributes.introduction.trim()
            ? attributes.introduction.trim().slice(0, 48)
            : null) ?? "Therapist",
        initials,
        photoUrl: photoByStaffId.get(row.id) ?? "",
        available: row.status === "active",
        daySchedule: parseDaySchedule(attributes.daySchedule),
        shiftPlan: parseShiftPlan(attributes.shiftPlan),
        workingDays: row.working_days,
        workingHoursStart: row.working_hours_start.slice(0, 5),
        workingHoursEnd: row.working_hours_end.slice(0, 5),
      };
    });

    return { staff, currency };
  },
  ["booking-staff-list"],
  { revalidate: 30, tags: ["booking-staff"] },
);

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const today = todayDateInZone(timeZone);
    const payload = await getBookingStaffForTenant(
      tenant.id,
      tenant.settings.currency,
    );

    return NextResponse.json(
      {
        ...payload,
        staff: payload.staff.filter((member) =>
          isStaffWorkingOnDate(
            "active",
            member.daySchedule,
            today,
            member.shiftPlan,
          ),
        ),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    throw error;
  }
}
