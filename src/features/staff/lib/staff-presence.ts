import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Staff counts as online if last_seen_at is within this window. */
export const STAFF_ONLINE_WINDOW_MS = 20 * 60 * 1000;

type ServiceClient = SupabaseClient<Database>;

export function isStaffPresenceOnline(
  lastSeenAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!lastSeenAt) return false;
  const seen = new Date(lastSeenAt).getTime();
  if (Number.isNaN(seen)) return false;
  return now - seen < STAFF_ONLINE_WINDOW_MS;
}

export async function markStaffSessionOnline(
  supabase: ServiceClient,
  args: { tenantId: string; staffId: string },
) {
  const now = new Date().toISOString();
  await supabase
    .from("staff_accounts")
    .update({
      session_started_at: now,
      last_seen_at: now,
      updated_at: now,
    })
    .eq("tenant_id", args.tenantId)
    .eq("staff_id", args.staffId);
}

export async function touchStaffSessionPresence(
  supabase: ServiceClient,
  args: { tenantId: string; staffId: string },
) {
  const now = new Date().toISOString();
  await supabase
    .from("staff_accounts")
    .update({
      last_seen_at: now,
      updated_at: now,
    })
    .eq("tenant_id", args.tenantId)
    .eq("staff_id", args.staffId)
    .not("session_started_at", "is", null);
}

export async function markStaffSessionOffline(
  supabase: ServiceClient,
  args: { tenantId: string; staffId: string },
) {
  const now = new Date().toISOString();
  await supabase
    .from("staff_accounts")
    .update({
      session_started_at: null,
      last_seen_at: null,
      updated_at: now,
    })
    .eq("tenant_id", args.tenantId)
    .eq("staff_id", args.staffId);
}
