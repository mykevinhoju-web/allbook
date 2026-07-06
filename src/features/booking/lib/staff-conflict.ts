import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function hasStaffBookingConflict(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  staffId: string,
  startsAt: string,
  endsAt: string,
  excludeBookingId?: string,
): Promise<boolean> {
  let query = supabase
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
    query = query.neq("id", excludeBookingId);
  }

  const { data } = await query;
  return (data?.length ?? 0) > 0;
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
