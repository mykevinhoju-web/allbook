import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import {
  parseStaffAttributes,
  toStaffAttributesJson,
} from "@/features/staff/utils/attributes";

/** Staff counts as online if last_seen_at is within this window. */
export const STAFF_ONLINE_WINDOW_MS = 20 * 60 * 1000;
export const STAFF_CURRENT_ROOM_KEY = "currentRoomName";

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

export async function setStaffCurrentRoom(
  supabase: ServiceClient,
  args: { tenantId: string; staffId: string; roomName: string },
) {
  const roomName = args.roomName.trim();
  if (!roomName) return;

  const { data } = await supabase
    .from("staff")
    .select("attributes")
    .eq("tenant_id", args.tenantId)
    .eq("id", args.staffId)
    .maybeSingle();

  const attributes = parseStaffAttributes((data?.attributes ?? {}) as never);
  attributes[STAFF_CURRENT_ROOM_KEY] = roomName;
  await supabase
    .from("staff")
    .update({
      attributes: toStaffAttributesJson(attributes),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.staffId);
}

export async function clearStaffCurrentRoom(
  supabase: ServiceClient,
  args: { tenantId: string; staffId: string },
) {
  const { data } = await supabase
    .from("staff")
    .select("attributes")
    .eq("tenant_id", args.tenantId)
    .eq("id", args.staffId)
    .maybeSingle();

  const attributes = parseStaffAttributes((data?.attributes ?? {}) as never);
  if (!(STAFF_CURRENT_ROOM_KEY in attributes)) return;
  delete attributes[STAFF_CURRENT_ROOM_KEY];
  await supabase
    .from("staff")
    .update({
      attributes: toStaffAttributesJson(attributes),
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", args.tenantId)
    .eq("id", args.staffId);
}
