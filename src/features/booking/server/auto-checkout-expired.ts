import type { SupabaseClient } from "@supabase/supabase-js";

import { markStaffSessionOffline } from "@/features/staff/lib/staff-presence";
import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

/** Wait briefly past ends_at so tablet auto-end / extend can win the race. */
const DEFAULT_GRACE_MS = 60_000;

export interface AutoCheckoutResult {
  checkedOut: number;
  bookingIds: string[];
}

/**
 * Completes checked-in bookings whose scheduled end time has passed.
 * Does not require the room tablet to be open.
 */
export async function autoCheckoutExpiredBookings(
  supabase: ServiceClient,
  options: { tenantId?: string; graceMs?: number; now?: Date } = {},
): Promise<AutoCheckoutResult> {
  const now = options.now ?? new Date();
  const graceMs = options.graceMs ?? DEFAULT_GRACE_MS;
  const cutoff = new Date(now.getTime() - graceMs).toISOString();
  const checkedOutAt = now.toISOString();

  let query = supabase
    .from("bookings")
    .select("id, tenant_id, staff_id, room_id, ends_at")
    .not("checked_in_at", "is", null)
    .is("checked_out_at", null)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .lt("ends_at", cutoff);

  if (options.tenantId) {
    query = query.eq("tenant_id", options.tenantId);
  }

  const { data: rows, error } = await query.limit(200);
  if (error || !rows?.length) {
    return { checkedOut: 0, bookingIds: [] };
  }

  const bookingIds: string[] = [];
  const staffKeys = new Set<string>();

  for (const row of rows) {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        checked_out_at: checkedOutAt,
        status: "completed",
        updated_at: checkedOutAt,
      })
      .eq("id", row.id)
      .eq("tenant_id", row.tenant_id)
      .is("checked_out_at", null)
      .not("checked_in_at", "is", null);

    if (updateError) continue;

    bookingIds.push(row.id);
    staffKeys.add(`${row.tenant_id}:${row.staff_id}`);
  }

  await Promise.all(
    [...staffKeys].map(async (key) => {
      const [tenantId, staffId] = key.split(":");
      if (!tenantId || !staffId) return;
      await markStaffSessionOffline(supabase, { tenantId, staffId });
    }),
  );

  return { checkedOut: bookingIds.length, bookingIds };
}
