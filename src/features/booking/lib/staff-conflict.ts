import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { listBookingIdsForStaff } from "./booking-staffs";

export async function hasStaffBookingConflict(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  staffId: string,
  startsAt: string,
  endsAt: string,
  excludeBookingId?: string,
): Promise<boolean> {
  let primaryQuery = supabase
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (excludeBookingId) {
    primaryQuery = primaryQuery.neq("id", excludeBookingId);
  }

  const { data: primaryHits } = await primaryQuery;
  if ((primaryHits?.length ?? 0) > 0) return true;

  const joinedIds = await listBookingIdsForStaff(supabase, tenantId, staffId);
  const candidateIds = excludeBookingId
    ? joinedIds.filter((id) => id !== excludeBookingId)
    : joinedIds;

  if (candidateIds.length === 0) return false;

  const { data: joinedHits } = await supabase
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenantId)
    .in("id", candidateIds)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  return (joinedHits?.length ?? 0) > 0;
}

export async function hasRoomBookingConflict(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  roomId: string,
  startsAt: string,
  endsAt: string,
  excludeBookingId?: string,
): Promise<boolean> {
  let query = supabase
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("room_id", roomId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
}

/**
 * Next booking start times (same room or same staff) that can cap a
 * check-in service window of [fromIso, untilIso).
 */
export async function getCheckInBlockingStarts(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  opts: {
    roomId: string;
    staffId: string;
    fromIso: string;
    untilIso: string;
    excludeBookingId: string;
  },
): Promise<string[]> {
  const joinedIds = await listBookingIdsForStaff(
    supabase,
    tenantId,
    opts.staffId,
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("id, starts_at, room_id, staff_id")
    .eq("tenant_id", tenantId)
    .neq("id", opts.excludeBookingId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .gt("starts_at", opts.fromIso)
    .lt("starts_at", opts.untilIso);

  if (error || !data) return [];

  const staffBookingIds = new Set(joinedIds);

  return data
    .filter(
      (row) =>
        row.room_id === opts.roomId ||
        row.staff_id === opts.staffId ||
        staffBookingIds.has(row.id),
    )
    .map((row) => row.starts_at);
}
