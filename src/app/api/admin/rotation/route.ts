import { NextResponse } from "next/server";

import { isValidReportDate } from "@/features/admin/lib/revenue-report";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "@/features/booking/lib/booking-other-staff";
import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import {
  countWalkInsByStaff,
  listInServiceStaffIds,
  loadWalkInRotation,
} from "@/features/booking/server/assign-walk-in-staff";
import type { StaffAttributes, StaffStatus } from "@/features/staff/types";
import { getStaffWorkingTodayLabel } from "@/features/staff/utils/shift-label";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date")?.trim() || todayDateInZone(timeZone);

    if (!isValidReportDate(date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });

    const [{ data: staffRows, error: staffError }, rotation] = await Promise.all([
      supabase
        .from("staff")
        .select(
          "id, name, status, attributes, working_hours_start, working_hours_end, sort_order",
        )
        .eq("tenant_id", tenant.id)
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      loadWalkInRotation(supabase, tenant.id, date),
    ]);

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }

    const working = (staffRows ?? [])
      .filter((row) => !isOtherStaffGuestAttributes(row.attributes))
      .filter((row) => {
        const { workingToday } = getStaffWorkingTodayLabel({
          status: (row.status as StaffStatus) ?? "active",
          attributes: (row.attributes ?? {}) as StaffAttributes,
          date,
          timeZone,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
        });
        return workingToday;
      })
      .map((row) => ({ id: row.id, name: row.name }));

    const workingIds = new Set(working.map((row) => row.id));
    const orderedRotation = rotation.filter((row) => workingIds.has(row.staffId));
    const staffIds = [
      ...new Set([
        ...orderedRotation.map((row) => row.staffId),
        ...working.map((row) => row.id),
      ]),
    ];

    const [walkInCounts, inServiceIds] = await Promise.all([
      countWalkInsByStaff(supabase, {
        tenantId: tenant.id,
        workDate: date,
        timeZone,
        staffIds,
      }),
      listInServiceStaffIds(supabase, tenant.id, staffIds),
    ]);

    const nameById = new Map(working.map((row) => [row.id, row.name]));
    for (const row of staffRows ?? []) {
      if (!nameById.has(row.id)) nameById.set(row.id, row.name);
    }

    return NextResponse.json({
      date,
      working: working.map((row) => ({
        ...row,
        inService: inServiceIds.has(row.id),
        walkInCount: walkInCounts[row.id] ?? 0,
        inRotation: orderedRotation.some((item) => item.staffId === row.id),
      })),
      rotation: orderedRotation.map((row) => ({
        staffId: row.staffId,
        name: nameById.get(row.staffId) ?? "Staff",
        sortOrder: row.sortOrder,
        inService: inServiceIds.has(row.staffId),
        walkInCount: walkInCounts[row.staffId] ?? 0,
      })),
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const body = (await request.json()) as {
      date?: string;
      staffIds?: string[];
    };
    const date = body.date?.trim() || todayDateInZone(timeZone);
    const staffIds = Array.isArray(body.staffIds)
      ? body.staffIds.filter((id) => typeof id === "string" && id.length > 0)
      : [];

    if (!isValidReportDate(date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const uniqueIds = [...new Set(staffIds)];
    const supabase = createServiceSupabase();

    if (uniqueIds.length > 0) {
      const { data: staffRows, error: staffError } = await supabase
        .from("staff")
        .select("id, attributes, status")
        .eq("tenant_id", tenant.id)
        .in("id", uniqueIds);

      if (staffError) {
        return NextResponse.json({ error: staffError.message }, { status: 503 });
      }

      const valid = new Set(
        (staffRows ?? [])
          .filter(
            (row) =>
              row.status === "active" &&
              !isOtherStaffGuestAttributes(row.attributes),
          )
          .map((row) => row.id),
      );

      if (valid.size !== uniqueIds.length) {
        return NextResponse.json(
          { error: "One or more staff cannot be added to rotation." },
          { status: 400 },
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("staff_walk_in_rotation")
      .delete()
      .eq("tenant_id", tenant.id)
      .eq("work_date", date);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 503 });
    }

    if (uniqueIds.length > 0) {
      const now = new Date().toISOString();
      const { error: insertError } = await supabase
        .from("staff_walk_in_rotation")
        .insert(
          uniqueIds.map((staffId, index) => ({
            tenant_id: tenant.id,
            work_date: date,
            staff_id: staffId,
            sort_order: index + 1,
            updated_at: now,
          })),
        );

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 503 });
      }
    }

    return NextResponse.json({ ok: true, date, staffIds: uniqueIds });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
