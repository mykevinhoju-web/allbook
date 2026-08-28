import type { SupabaseClient } from "@supabase/supabase-js";

import {
  dateInTimeZone,
  reportDateRangeToUtc,
  todayDateInZone,
} from "@/features/admin/lib/revenue-report";
import { addDaysToDateInput } from "@/features/booking/lib/schedule-utils";
import { hasStaffBookingConflict } from "@/features/booking/lib/staff-conflict";
import {
  isWalkInBooking,
  pickWalkInStaff,
  appendNewcomersAtEnd,
  compareRotationListOrder,
  type WalkInRotationMember,
} from "@/features/booking/lib/walk-in-rotation";
import type { StaffAttributes, StaffStatus } from "@/features/staff/types";
import {
  getActiveShiftAnchorDate,
  isStaffOnShiftNow,
} from "@/features/staff/utils/shift-label";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

/** One persistent rotation order per tenant (not a per-day list). */
export const ROTATION_ROSTER_DATE = "1970-01-01";

async function loadRotationForDate(
  supabase: ServiceClient,
  tenantId: string,
  workDate: string,
): Promise<WalkInRotationMember[]> {
  const { data, error } = await supabase
    .from("staff_walk_in_rotation")
    .select("staff_id, sort_order")
    .eq("tenant_id", tenantId)
    .eq("work_date", workDate)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => ({
      staffId: row.staff_id,
      sortOrder: row.sort_order,
    }))
    .sort(compareRotationListOrder);
}

export async function loadWalkInRotation(
  supabase: ServiceClient,
  tenantId: string,
  _workDate?: string,
): Promise<WalkInRotationMember[]> {
  const roster = await loadRotationForDate(
    supabase,
    tenantId,
    ROTATION_ROSTER_DATE,
  );
  if (roster.length > 0) return roster;

  const { data: latest, error } = await supabase
    .from("staff_walk_in_rotation")
    .select("work_date")
    .eq("tenant_id", tenantId)
    .neq("work_date", ROTATION_ROSTER_DATE)
    .order("work_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!latest?.work_date) return [];

  const source = await loadRotationForDate(
    supabase,
    tenantId,
    latest.work_date,
  );
  if (source.length === 0) return [];

  const now = new Date().toISOString();
  const { error: insertError } = await supabase
    .from("staff_walk_in_rotation")
    .insert(
      source.map((row) => ({
        tenant_id: tenantId,
        work_date: ROTATION_ROSTER_DATE,
        staff_id: row.staffId,
        sort_order: row.sortOrder,
        updated_at: now,
      })),
    );

  if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
    throw new Error(insertError.message);
  }

  return loadRotationForDate(supabase, tenantId, ROTATION_ROSTER_DATE);
}

export async function appendWalkInRotationNewcomers(
  supabase: ServiceClient,
  args: {
    tenantId: string;
    staffIds: string[];
  },
): Promise<WalkInRotationMember[]> {
  const roster = await loadWalkInRotation(supabase, args.tenantId);
  const existingIds = new Set(roster.map((row) => row.staffId));
  const extras = args.staffIds.filter(
    (staffId) => staffId && !existingIds.has(staffId),
  );
  if (extras.length === 0) return roster;

  const next = appendNewcomersAtEnd(roster, extras);
  const now = new Date().toISOString();
  const toInsert = next.filter((row) => !existingIds.has(row.staffId));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("staff_walk_in_rotation").insert(
      toInsert.map((row) => ({
        tenant_id: args.tenantId,
        work_date: ROTATION_ROSTER_DATE,
        staff_id: row.staffId,
        sort_order: row.sortOrder,
        updated_at: now,
      })),
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  return next;
}

export async function saveWalkInRotationRoster(
  supabase: ServiceClient,
  args: {
    tenantId: string;
    incoming: WalkInRotationMember[];
    onShiftIds: Iterable<string>;
  },
): Promise<string[]> {
  const roster = await loadWalkInRotation(supabase, args.tenantId);
  const incoming = args.incoming.filter((row) => row.staffId);
  const onShift = new Set(args.onShiftIds);
  const incomingSet = new Set(incoming.map((row) => row.staffId));

  const offShiftKept = roster.filter(
    (row) => !incomingSet.has(row.staffId) && !onShift.has(row.staffId),
  );
  const next = [...incoming, ...offShiftKept];

  const { error: deleteError } = await supabase
    .from("staff_walk_in_rotation")
    .delete()
    .eq("tenant_id", args.tenantId)
    .eq("work_date", ROTATION_ROSTER_DATE);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (next.length > 0) {
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("staff_walk_in_rotation")
      .insert(
        next.map((row) => ({
          tenant_id: args.tenantId,
          work_date: ROTATION_ROSTER_DATE,
          staff_id: row.staffId,
          sort_order: row.sortOrder,
          updated_at: now,
        })),
      );
    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return next.map((row) => row.staffId);
}

export async function countWalkInsByStaff(
  supabase: ServiceClient,
  args: {
    tenantId: string;
    workDate: string;
    timeZone: string;
    staffIds: string[];
  },
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const id of args.staffIds) counts[id] = 0;
  if (args.staffIds.length === 0) return counts;

  // Include adjacent calendar days so overnight-shift walk-ins after midnight
  // attribute to the same work date shown on the rotation screen.
  const queryFrom = addDaysToDateInput(args.workDate, -1);
  const queryTo = addDaysToDateInput(args.workDate, 1);
  const { rangeStart } = reportDateRangeToUtc(
    queryFrom,
    queryFrom,
    args.timeZone,
  );
  const { rangeEnd } = reportDateRangeToUtc(queryTo, queryTo, args.timeZone);

  const [{ data, error }, { data: staffRows, error: staffError }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("staff_id, notes, starts_at")
        .eq("tenant_id", args.tenantId)
        .in("staff_id", args.staffIds)
        .neq("status", "cancelled")
        .gte("starts_at", rangeStart)
        .lt("starts_at", rangeEnd),
      supabase
        .from("staff")
        .select(
          "id, status, attributes, working_hours_start, working_hours_end",
        )
        .eq("tenant_id", args.tenantId)
        .in("id", args.staffIds),
    ]);

  if (error) {
    throw new Error(error.message);
  }
  if (staffError) {
    throw new Error(staffError.message);
  }

  const staffById = new Map((staffRows ?? []).map((row) => [row.id, row]));

  for (const row of data ?? []) {
    if (!isWalkInBooking(row.notes)) continue;
    const staff = staffById.get(row.staff_id);
    const bookingWorkDate = staff
      ? resolveWalkInCountWorkDate({
          status: (staff.status as StaffStatus) ?? "active",
          attributes: (staff.attributes ?? {}) as StaffAttributes,
          calendarDate: dateInTimeZone(row.starts_at, args.timeZone),
          timeZone: args.timeZone,
          workingHoursStart: staff.working_hours_start,
          workingHoursEnd: staff.working_hours_end,
          now: new Date(row.starts_at),
        })
      : dateInTimeZone(row.starts_at, args.timeZone);
    if (bookingWorkDate !== args.workDate) continue;
    counts[row.staff_id] = (counts[row.staff_id] ?? 0) + 1;
  }

  const { data: adjusts, error: adjustError } = await supabase
    .from("staff_walk_in_count_adjust")
    .select("staff_id, delta")
    .eq("tenant_id", args.tenantId)
    .eq("work_date", args.workDate)
    .in("staff_id", args.staffIds);

  if (adjustError) {
    throw new Error(adjustError.message);
  }

  for (const row of adjusts ?? []) {
    counts[row.staff_id] = Math.max(
      0,
      (counts[row.staff_id] ?? 0) + (row.delta ?? 0),
    );
  }

  return counts;
}

export function resolveWalkInCountWorkDate(args: {
  status: StaffStatus;
  attributes: StaffAttributes | unknown;
  calendarDate: string;
  timeZone: string;
  workingHoursStart?: string | null;
  workingHoursEnd?: string | null;
  now?: Date;
}): string {
  const now = args.now ?? new Date();
  const yesterday = addDaysToDateInput(args.calendarDate, -1);
  const anchor = getActiveShiftAnchorDate({
    status: args.status,
    attributes: args.attributes as StaffAttributes,
    date: args.calendarDate,
    timeZone: args.timeZone,
    workingHoursStart: args.workingHoursStart,
    workingHoursEnd: args.workingHoursEnd,
    now,
  });
  return anchor === yesterday ? yesterday : args.calendarDate;
}

export async function bumpWalkInCountAdjust(args: {
  supabase: ServiceClient;
  tenantId: string;
  workDate: string;
  timeZone: string;
  staffId: string;
  step: 1 | -1;
}): Promise<{ walkInCount: number }> {
  const { data: existing, error: readError } = await args.supabase
    .from("staff_walk_in_count_adjust")
    .select("delta")
    .eq("tenant_id", args.tenantId)
    .eq("work_date", args.workDate)
    .eq("staff_id", args.staffId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  const counts = await countWalkInsByStaff(args.supabase, {
    tenantId: args.tenantId,
    workDate: args.workDate,
    timeZone: args.timeZone,
    staffIds: [args.staffId],
  });
  const currentEffective = counts[args.staffId] ?? 0;
  if (args.step < 0 && currentEffective <= 0) {
    return { walkInCount: 0 };
  }

  const currentDelta = existing?.delta ?? 0;
  const nextDelta = currentDelta + args.step;
  const now = new Date().toISOString();

  if (nextDelta === 0) {
    if (existing) {
      const { error: deleteError } = await args.supabase
        .from("staff_walk_in_count_adjust")
        .delete()
        .eq("tenant_id", args.tenantId)
        .eq("work_date", args.workDate)
        .eq("staff_id", args.staffId);
      if (deleteError) throw new Error(deleteError.message);
    }
  } else if (existing) {
    const { error: updateError } = await args.supabase
      .from("staff_walk_in_count_adjust")
      .update({ delta: nextDelta, updated_at: now })
      .eq("tenant_id", args.tenantId)
      .eq("work_date", args.workDate)
      .eq("staff_id", args.staffId);
    if (updateError) throw new Error(updateError.message);
  } else {
    const { error: insertError } = await args.supabase
      .from("staff_walk_in_count_adjust")
      .insert({
        tenant_id: args.tenantId,
        work_date: args.workDate,
        staff_id: args.staffId,
        delta: nextDelta,
        updated_at: now,
      });
    if (insertError) throw new Error(insertError.message);
  }

  const next = await countWalkInsByStaff(args.supabase, {
    tenantId: args.tenantId,
    workDate: args.workDate,
    timeZone: args.timeZone,
    staffIds: [args.staffId],
  });
  return { walkInCount: next[args.staffId] ?? 0 };
}

export async function listInServiceStaff(
  supabase: ServiceClient,
  tenantId: string,
  staffIds: string[],
): Promise<{ ids: Set<string>; roomByStaffId: Map<string, string> }> {
  const ids = new Set<string>();
  const roomByStaffId = new Map<string, string>();
  if (staffIds.length === 0) return { ids, roomByStaffId };

  const { data, error } = await supabase
    .from("bookings")
    .select("staff_id, rooms(name)")
    .eq("tenant_id", tenantId)
    .in("staff_id", staffIds)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .not("checked_in_at", "is", null)
    .is("checked_out_at", null);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as Array<{
    staff_id: string;
    rooms?: { name: string } | { name: string }[] | null;
  }>) {
    ids.add(row.staff_id);
    const rooms = row.rooms;
    const roomName = (Array.isArray(rooms) ? rooms[0]?.name : rooms?.name)?.trim();
    if (roomName && !roomByStaffId.has(row.staff_id)) {
      roomByStaffId.set(row.staff_id, roomName);
    }
  }
  return { ids, roomByStaffId };
}

export async function listInServiceStaffIds(
  supabase: ServiceClient,
  tenantId: string,
  staffIds: string[],
): Promise<Set<string>> {
  const { ids } = await listInServiceStaff(supabase, tenantId, staffIds);
  return ids;
}

async function listOffShiftStaffIds(
  supabase: ServiceClient,
  args: {
    tenantId: string;
    staffIds: string[];
    workDate: string;
    timeZone: string;
    now: Date;
  },
): Promise<Set<string>> {
  const off = new Set<string>();
  if (args.staffIds.length === 0) return off;

  const { data, error } = await supabase
    .from("staff")
    .select("id, status, attributes, working_hours_start, working_hours_end")
    .eq("tenant_id", args.tenantId)
    .in("id", args.staffIds);

  if (error) {
    throw new Error(error.message);
  }

  const found = new Set((data ?? []).map((row) => row.id));
  for (const id of args.staffIds) {
    if (!found.has(id)) off.add(id);
  }

  for (const row of data ?? []) {
    const bookable = isStaffOnShiftNow({
      status: (row.status as StaffStatus) ?? "active",
      attributes: (row.attributes ?? {}) as StaffAttributes,
      date: args.workDate,
      timeZone: args.timeZone,
      workingHoursStart: row.working_hours_start,
      workingHoursEnd: row.working_hours_end,
      now: args.now,
    });
    if (!bookable) off.add(row.id);
  }

  return off;
}

export async function assignWalkInStaff(args: {
  supabase: ServiceClient;
  tenantId: string;
  timeZone: string;
  startsAtIso: string;
  endsAtIso: string;
  workDate?: string;
}): Promise<
  | { ok: true; staffId: string }
  | { ok: false; status: number; error: string }
> {
  const workDate =
    args.workDate ?? todayDateInZone(args.timeZone, new Date(args.startsAtIso));

  const rotation = await loadWalkInRotation(
    args.supabase,
    args.tenantId,
    workDate,
  );
  if (rotation.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "Set the rotation before booking a walk-in.",
    };
  }

  const staffIds = rotation.map((row) => row.staffId);
  const now = new Date(args.startsAtIso);
  const yesterday = addDaysToDateInput(workDate, -1);

  const { data: staffRows } = await args.supabase
    .from("staff")
    .select("id, status, attributes, working_hours_start, working_hours_end")
    .eq("tenant_id", args.tenantId)
    .in("id", staffIds);

  const [walkInCountsToday, walkInCountsYesterday, inServiceIds, offShiftIds] =
    await Promise.all([
      countWalkInsByStaff(args.supabase, {
        tenantId: args.tenantId,
        workDate,
        timeZone: args.timeZone,
        staffIds,
      }),
      countWalkInsByStaff(args.supabase, {
        tenantId: args.tenantId,
        workDate: yesterday,
        timeZone: args.timeZone,
        staffIds,
      }),
      listInServiceStaffIds(args.supabase, args.tenantId, staffIds),
      listOffShiftStaffIds(args.supabase, {
        tenantId: args.tenantId,
        staffIds,
        workDate,
        timeZone: args.timeZone,
        now,
      }),
    ]);

  const walkInCounts: Record<string, number> = {};
  for (const id of staffIds) {
    const row = (staffRows ?? []).find((item) => item.id === id);
    const anchor = row
      ? getActiveShiftAnchorDate({
          status: (row.status as StaffStatus) ?? "active",
          attributes: (row.attributes ?? {}) as StaffAttributes,
          date: workDate,
          timeZone: args.timeZone,
          workingHoursStart: row.working_hours_start,
          workingHoursEnd: row.working_hours_end,
          now,
        })
      : workDate;
    walkInCounts[id] =
      anchor === yesterday
        ? (walkInCountsYesterday[id] ?? 0)
        : (walkInCountsToday[id] ?? 0);
  }

  const slotBusyIds = new Set<string>();
  await Promise.all(
    staffIds.map(async (staffId) => {
      const busy = await hasStaffBookingConflict(
        args.supabase,
        args.tenantId,
        staffId,
        args.startsAtIso,
        args.endsAtIso,
      );
      if (busy) slotBusyIds.add(staffId);
    }),
  );

  const staffId = pickWalkInStaff({
    rotation,
    walkInCounts,
    inServiceIds,
    slotBusyIds,
    offShiftIds,
  });

  if (!staffId) {
    return {
      ok: false,
      status: 409,
      error:
        "Every rotation staff member is off shift, in service, or already booked at that time.",
    };
  }

  return { ok: true, staffId };
}
