import { NextResponse } from "next/server";

import { addDaysToDateInput, todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "@/features/booking/lib/booking-other-staff";
import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import {
  countWalkInsByStaff,
  listInServiceStaff,
  loadWalkInRotation,
  appendWalkInRotationNewcomers,
  saveWalkInRotationRoster,
} from "@/features/booking/server/assign-walk-in-staff";
import { appendNewcomersAtEnd } from "@/features/booking/lib/walk-in-rotation";
import type { StaffAttributes, StaffStatus } from "@/features/staff/types";
import {
  getActiveShiftAnchorDate,
  isStaffOnShiftNow,
} from "@/features/staff/utils/shift-label";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const now = new Date();
    const date = todayDateInZone(timeZone, now);

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
      loadWalkInRotation(supabase, tenant.id),
    ]);

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }

    const workingRows = (staffRows ?? [])
      .filter((row) => !isOtherStaffGuestAttributes(row.attributes))
      .filter((row) =>
        isStaffOnShiftNow({
          status: (row.status as StaffStatus) ?? "active",
          attributes: (row.attributes ?? {}) as StaffAttributes,
          date,
          timeZone,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
          now,
        }),
      );

    const working = workingRows.map((row) => ({ id: row.id, name: row.name }));

    const workingIds = new Set(working.map((row) => row.id));
    const rosterIds = new Set(rotation.map((row) => row.staffId));
    const newcomers = working.filter((row) => !rosterIds.has(row.id));

    let roster = rotation;
    try {
      roster = await appendWalkInRotationNewcomers(supabase, {
        tenantId: tenant.id,
        staffIds: newcomers.map((row) => row.id),
      });
    } catch {
      roster = appendNewcomersAtEnd(
        rotation,
        newcomers.map((row) => row.id),
      );
    }

    const orderedRotation = roster.filter((row) => workingIds.has(row.staffId));

    const staffIds = orderedRotation.map((row) => row.staffId);
    const yesterday = addDaysToDateInput(date, -1);
    const staffById = new Map(workingRows.map((row) => [row.id, row]));
    const needsYesterday = staffIds.some((id) => {
      const row = staffById.get(id);
      if (!row) return false;
      return (
        getActiveShiftAnchorDate({
          status: (row.status as StaffStatus) ?? "active",
          attributes: (row.attributes ?? {}) as StaffAttributes,
          date,
          timeZone,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
          now,
        }) === yesterday
      );
    });

    const [walkInCountsToday, walkInCountsYesterday, inService] =
      await Promise.all([
        countWalkInsByStaff(supabase, {
          tenantId: tenant.id,
          workDate: date,
          timeZone,
          staffIds,
        }),
        needsYesterday
          ? countWalkInsByStaff(supabase, {
              tenantId: tenant.id,
              workDate: yesterday,
              timeZone,
              staffIds,
            })
          : Promise.resolve({} as Record<string, number>),
        listInServiceStaff(supabase, tenant.id, staffIds),
      ]);
    const inServiceIds = inService.ids;

    const walkInCounts: Record<string, number> = {};
    for (const id of staffIds) {
      const row = staffById.get(id);
      const anchor = row
        ? getActiveShiftAnchorDate({
            status: (row.status as StaffStatus) ?? "active",
            attributes: (row.attributes ?? {}) as StaffAttributes,
            date,
            timeZone,
            workingHoursStart: row.working_hours_start,
            workingHoursEnd: row.working_hours_end,
            now,
          })
        : date;
      walkInCounts[id] =
        anchor === yesterday
          ? (walkInCountsYesterday[id] ?? 0)
          : (walkInCountsToday[id] ?? 0);
    }

    const nameById = new Map(working.map((row) => [row.id, row.name]));
    for (const row of staffRows ?? []) {
      if (!nameById.has(row.id)) nameById.set(row.id, row.name);
    }

    return NextResponse.json({
      date,
      working: working.map((row) => ({
        ...row,
        inService: inServiceIds.has(row.id),
        roomName: inService.roomByStaffId.get(row.id) ?? null,
        walkInCount: walkInCounts[row.id] ?? 0,
        inRotation: true,
      })),
      rotation: orderedRotation.map((row) => ({
        staffId: row.staffId,
        name: nameById.get(row.staffId) ?? "Staff",
        sortOrder: row.sortOrder,
        inService: inServiceIds.has(row.staffId),
        roomName: inService.roomByStaffId.get(row.staffId) ?? null,
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
    const now = new Date();
    const date = todayDateInZone(timeZone, now);
    const body = (await request.json()) as {
      staffIds?: string[];
      roster?: { staffId?: string; sortOrder?: number }[];
    };
    const fromRoster = Array.isArray(body.roster)
      ? body.roster
          .filter(
            (row) =>
              typeof row?.staffId === "string" && row.staffId.length > 0,
          )
          .map((row) => {
            const order = Number(row.sortOrder);
            return {
              staffId: row.staffId as string,
              sortOrder: Number.isFinite(order) ? order : 0,
            };
          })
      : [];
    const fromIds = Array.isArray(body.staffIds)
      ? body.staffIds
          .filter((id) => typeof id === "string" && id.length > 0)
          .map((staffId, index) => ({ staffId, sortOrder: index + 1 }))
      : [];
    const incoming: { staffId: string; sortOrder: number }[] = [];
    const seen = new Set<string>();
    for (const row of fromRoster.length > 0 ? fromRoster : fromIds) {
      if (seen.has(row.staffId)) continue;
      seen.add(row.staffId);
      incoming.push(row);
    }
    const uniqueIds = incoming.map((row) => row.staffId);
    const supabase = createServiceSupabase();

    const { data: staffRows, error: staffError } = await supabase
      .from("staff")
      .select(
        "id, attributes, status, working_hours_start, working_hours_end",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "active");

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }

    const onShiftIds = (staffRows ?? [])
      .filter((row) => !isOtherStaffGuestAttributes(row.attributes))
      .filter((row) =>
        isStaffOnShiftNow({
          status: (row.status as StaffStatus) ?? "active",
          attributes: (row.attributes ?? {}) as StaffAttributes,
          date,
          timeZone,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
          now,
        }),
      )
      .map((row) => row.id);

    const valid = new Set(
      (staffRows ?? [])
        .filter(
          (row) =>
            row.status === "active" &&
            !isOtherStaffGuestAttributes(row.attributes),
        )
        .map((row) => row.id),
    );

    if (uniqueIds.some((id) => !valid.has(id))) {
      return NextResponse.json(
        { error: "One or more staff cannot be added to rotation." },
        { status: 400 },
      );
    }

    try {
      const saved = await saveWalkInRotationRoster(supabase, {
        tenantId: tenant.id,
        incoming,
        onShiftIds,
      });
      return NextResponse.json({ ok: true, staffIds: saved });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save rotation.";
      return NextResponse.json({ error: message }, { status: 503 });
    }
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
