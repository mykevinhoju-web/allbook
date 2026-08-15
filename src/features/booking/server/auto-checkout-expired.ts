import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type ServiceClient = SupabaseClient<Database>;

export interface AutoCheckoutResult {
  checkedOut: number;
  bookingIds: string[];
}

/**
 * Checked-in room services stay live until staff taps End service.
 * Kept as a no-op so existing cron / route call sites remain valid.
 */
export async function autoCheckoutExpiredBookings(
  _supabase?: ServiceClient,
  _options: { tenantId?: string; graceMs?: number; now?: Date } = {},
): Promise<AutoCheckoutResult> {
  return { checkedOut: 0, bookingIds: [] };
}
