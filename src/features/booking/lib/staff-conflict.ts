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
  const { data } = await supabase
    .from("bookings")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  return (data ?? []).some((booking) => booking.id !== excludeBookingId);
}
