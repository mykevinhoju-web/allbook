import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { GoogleSyncSalonRow, GoogleSyncTarget } from "./types";

type AnySupabase = SupabaseClient<Database>;

const SALON_SYNC_SELECT = [
  "id",
  "name",
  "google_place_id",
  "owner_name_override",
  "google_snapshot_hash",
  "address",
  "suburb",
  "city",
  "state",
  "postcode",
  "country",
  "latitude",
  "longitude",
  "phone",
  "website",
  "rating",
  "review_count",
  "opening_hours",
  "google_categories",
  "google_photos",
  "google_business_status",
  "permanently_closed",
].join(", ");

/**
 * Select imported Google businesses for a sync target.
 * Marketplace search is untouched — this only reads salons for Place Details refresh.
 */
export async function selectSalonsForSync(
  supabase: AnySupabase,
  target: GoogleSyncTarget,
  options?: {
    excludeIds?: string[];
    limit?: number;
    offset?: number;
  },
): Promise<GoogleSyncSalonRow[]> {
  const limit = options?.limit ?? 5000;
  const offset = options?.offset ?? 0;
  const exclude = new Set(options?.excludeIds ?? []);

  if (target.scope === "single") {
    if (!target.salonId) return [];
    const { data } = await supabase
      .from("salons")
      .select(SALON_SYNC_SELECT)
      .eq("id", target.salonId)
      .not("google_place_id", "is", null)
      .maybeSingle();
    if (!data) return [];
    const row = data as unknown as GoogleSyncSalonRow;
    if (!row.google_place_id) return [];
    return [row];
  }

  let query = supabase
    .from("salons")
    .select(SALON_SYNC_SELECT)
    .not("google_place_id", "is", null)
    .order("google_synced_at", { ascending: true, nullsFirst: true })
    .range(offset, offset + limit - 1);

  if (target.country) {
    query = query.ilike("country", target.country);
  }

  if (target.scope === "city" || target.scope === "scheduled") {
    if (target.state) query = query.ilike("state", target.state);
    if (target.city) query = query.ilike("city", target.city);
  } else if (target.scope === "state") {
    if (target.state) query = query.ilike("state", target.state);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as unknown as GoogleSyncSalonRow[]).filter(
    (row) => row.google_place_id && !exclude.has(row.id),
  );
}

export async function countSalonsForSync(
  supabase: AnySupabase,
  target: GoogleSyncTarget,
): Promise<number> {
  if (target.scope === "single") {
    if (!target.salonId) return 0;
    const { count } = await supabase
      .from("salons")
      .select("id", { count: "exact", head: true })
      .eq("id", target.salonId)
      .not("google_place_id", "is", null);
    return count ?? 0;
  }

  let query = supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .not("google_place_id", "is", null);

  if (target.country) query = query.ilike("country", target.country);
  if (target.scope === "city" || target.scope === "scheduled") {
    if (target.state) query = query.ilike("state", target.state);
    if (target.city) query = query.ilike("city", target.city);
  } else if (target.scope === "state") {
    if (target.state) query = query.ilike("state", target.state);
  }

  const { count } = await query;
  return count ?? 0;
}
