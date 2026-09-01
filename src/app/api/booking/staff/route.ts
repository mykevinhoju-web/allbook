import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import {
  addDaysToDateInput,
  DEFAULT_BOOKING_TIMEZONE,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { isPublicBookingStaff } from "@/features/booking/lib/booking-other-staff";
import {
  resolveBookingStaffAvailability,
} from "@/features/booking/server/resolve-booking-staff-availability";
import { parseStaffAttributes } from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";
import type { StaffStatus } from "@/features/staff/types";

const getBookingStaffForTenant = unstable_cache(
  async (tenantId: string, currency: string, timeZone: string) => {
    const supabase = createServiceSupabase();
    const now = new Date();
    const today = todayDateInZone(timeZone, now);
    const rangeStart = addDaysToDateInput(today, -1);
    const rangeEnd = addDaysToDateInput(today, 15);

    const [{ data: staffRows, error }, { data: serviceRows }] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order",
        )
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("service_options")
        .select("duration_minutes")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("duration_minutes", { ascending: true })
        .limit(1),
    ]);

    if (error) {
      throw new Error(error.message);
    }

    const durationMinutes = Math.max(
      20,
      serviceRows?.[0]?.duration_minutes ?? 30,
    );

    const bookableRows = (staffRows ?? []).filter((row) =>
      isPublicBookingStaff({ name: row.name, attributes: row.attributes }),
    );

    const staffIds = bookableRows.map((row) => row.id);
    const photosByStaffId = new Map<string, string[]>();
    const bookingsByStaffId = new Map<
      string,
      { startsAt: string; endsAt: string }[]
    >();

    if (staffIds.length > 0) {
      const [{ data: photoRows }, { data: bookingRows }] = await Promise.all([
        supabase
          .from("staff_photos")
          .select("staff_id, url, sort_order")
          .in("staff_id", staffIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("bookings")
          .select("staff_id, starts_at, ends_at")
          .eq("tenant_id", tenantId)
          .in("staff_id", staffIds)
          .neq("status", "cancelled")
          .neq("status", "completed")
          .gte("starts_at", `${rangeStart}T00:00:00.000Z`)
          .lt("starts_at", `${rangeEnd}T00:00:00.000Z`),
      ]);

      for (const photo of photoRows ?? []) {
        const list = photosByStaffId.get(photo.staff_id) ?? [];
        list.push(photo.url);
        photosByStaffId.set(photo.staff_id, list);
      }

      for (const row of bookingRows ?? []) {
        const list = bookingsByStaffId.get(row.staff_id) ?? [];
        list.push({ startsAt: row.starts_at, endsAt: row.ends_at });
        bookingsByStaffId.set(row.staff_id, list);
      }
    }

    const staff = bookableRows
      .map((row) => {
        const attributes = parseStaffAttributes(row.attributes as never);
        const initials = row.name
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const photos = photosByStaffId.get(row.id) ?? [];
        const availability = resolveBookingStaffAvailability({
          status: row.status as StaffStatus,
          attributes,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
          bookings: bookingsByStaffId.get(row.id) ?? [],
          durationMinutes,
          timeZone,
          now,
        });

        return {
          id: row.id,
          name: row.name,
          role:
            (typeof attributes.introduction === "string" &&
            attributes.introduction.trim()
              ? attributes.introduction.trim().slice(0, 80)
              : null) ?? "Therapist",
          initials,
          photoUrl: photos[0] ?? "",
          photos,
          available: availability.available,
          availabilityTier: availability.tier,
          availabilityLabel: availability.label,
          availabilityDetail: availability.detail,
          sortOrder: row.sort_order,
          tierRank: availability.tierRank,
          daySchedule: parseDaySchedule(attributes.daySchedule),
          shiftPlan: parseShiftPlan(attributes.shiftPlan),
          workingDays: row.working_days,
          workingHoursStart: row.working_hours_start.slice(0, 5),
          workingHoursEnd: row.working_hours_end.slice(0, 5),
        };
      })
      .filter((member) =>
        isStaffWorkingOnDate(
          "active",
          member.daySchedule,
          today,
          member.shiftPlan,
          timeZone,
        ) || member.available,
      )
      .sort((a, b) => {
        if (a.tierRank !== b.tierRank) return a.tierRank - b.tierRank;
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
      })
      .map(
        ({
          sortOrder: _sortOrder,
          tierRank: _tierRank,
          daySchedule: _daySchedule,
          shiftPlan: _shiftPlan,
          workingDays: _workingDays,
          workingHoursStart: _workingHoursStart,
          workingHoursEnd: _workingHoursEnd,
          ...member
        }) => member,
      );

    return { staff, currency };
  },
  ["booking-staff-list-v3"],
  { revalidate: 30, tags: ["booking-staff"] },
);

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const payload = await getBookingStaffForTenant(
      tenant.id,
      tenant.settings.currency,
      timeZone,
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
      },
    });
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
