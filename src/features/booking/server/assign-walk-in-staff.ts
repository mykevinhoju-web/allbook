import type { SupabaseClient } from "@supabase/supabase-js";

import {
  reportDateRangeToUtc,
  todayDateInZone,
} from "@/features/admin/lib/revenue-report";
import { hasStaffBookingConflict } from "@/features/booking/lib/staff-conflict";
import {
  isWalkInBooking,
  pickWalkInStaff,
  type WalkInRotationMember,
} from "@/features/booking/lib/walk-in-rotation";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

export async function loadWalkInRotation(
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

  return (data ?? []).map((row) => ({
    staffId: row.staff_id,
    sortOrder: row.sort_order,
  }));
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

  const { rangeStart, rangeEnd } = reportDateRangeToUtc(
    args.workDate,
    args.workDate,
    args.timeZone,
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("staff_id, notes")
    .eq("tenant_id", args.tenantId)
    .in("staff_id", args.staffIds)
    .neq("status", "cancelled")
    .gte("starts_at", rangeStart)
    .lt("starts_at", rangeEnd);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    if (!isWalkInBooking(row.notes)) continue;
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

export async function listInServiceStaffIds(
  supabase: ServiceClient,
  tenantId: string,
  staffIds: string[],
): Promise<Set<string>> {
  const busy = new Set<string>();
  if (staffIds.length === 0) return busy;

  const { data, error } = await supabase
    .from("bookings")
    .select("staff_id")
    .eq("tenant_id", tenantId)
    .in("staff_id", staffIds)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .not("checked_in_at", "is", null)
    .is("checked_out_at", null);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) busy.add(row.staff_id);
  return busy;
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
      error: "Set today's rotation before booking a walk-in.",
    };
  }

  const staffIds = rotation.map((row) => row.staffId);
  const [walkInCounts, inServiceIds] = await Promise.all([
    countWalkInsByStaff(args.supabase, {
      tenantId: args.tenantId,
      workDate,
      timeZone: args.timeZone,
      staffIds,
    }),
    listInServiceStaffIds(args.supabase, args.tenantId, staffIds),
  ]);

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
  });

  if (!staffId) {
    return {
      ok: false,
      status: 409,
      error:
        "Every rotation staff member is in service or already booked at that time.",
    };
  }

  return { ok: true, staffId };
}
