import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { findDuplicateSuggestions, mapQueueItem } from "./duplicates";
import type {
  ImportErrorRow,
  QueueCounts,
  ReviewQueueItem,
  ReviewQueueTab,
  ReviewStatus,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

const QUEUE_SELECT = [
  "id",
  "name",
  "slug",
  "suburb",
  "city",
  "state",
  "phone",
  "website",
  "rating",
  "review_count",
  "source",
  "claimed",
  "review_status",
  "marketplace_visible",
  "permanently_closed",
  "google_place_id",
  "google_business_status",
  "imported_at",
  "google_synced_at",
  "reviewed_at",
  "duplicate_of_salon_id",
  "cover_image",
  "latitude",
  "longitude",
  "created_at",
  "updated_at",
].join(", ");

type Row = Parameters<typeof mapQueueItem>[0] & {
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
};

function asRows(data: unknown): Row[] {
  return (data ?? []) as Row[];
}

export async function getReviewQueueCounts(
  supabase: AnySupabase,
): Promise<QueueCounts> {
  const [newly, closed, missing, errors, allForDup, recentEvents] =
    await Promise.all([
      supabase
        .from("salons")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending")
        .eq("source", "google"),
      supabase
        .from("salons")
        .select("id", { count: "exact", head: true })
        .eq("permanently_closed", true),
      supabase
        .from("salons")
        .select("id", { count: "exact", head: true })
        .or(
          "google_business_status.eq.NOT_FOUND,google_place_id.is.null",
        )
        .eq("source", "google"),
      supabase
        .from("google_sync_run_items")
        .select("id", { count: "exact", head: true })
        .eq("result", "failed"),
      supabase
        .from("salons")
        .select(QUEUE_SELECT)
        .is("duplicate_of_salon_id", null)
        .limit(400),
      supabase
        .from("salons")
        .select("id, google_synced_at, reviewed_at, review_status")
        .eq("review_status", "approved")
        .not("google_synced_at", "is", null)
        .limit(500),
    ]);

  // Approximate duplicate pairs among recent/imported rows.
  const rows = asRows(allForDup.data);
  let dupCount = 0;
  const seen = new Set<string>();
  for (const row of rows.slice(0, 80)) {
    const suggestions = findDuplicateSuggestions(row, rows);
    for (const s of suggestions) {
      const key = [row.id, s.salon.id].sort().join(":");
      if (seen.has(key)) continue;
      seen.add(key);
      dupCount += 1;
    }
  }

  const updatedCount = (
    (recentEvents.data ?? []) as Array<{
      google_synced_at: string | null;
      reviewed_at: string | null;
    }>
  ).filter((row) => {
    if (!row.google_synced_at) return false;
    if (!row.reviewed_at) return true;
    return row.google_synced_at > row.reviewed_at;
  }).length;

  return {
    newly_imported: newly.count ?? 0,
    updated: updatedCount,
    duplicates: dupCount,
    closed: closed.count ?? 0,
    missing: missing.count ?? 0,
    import_errors: errors.count ?? 0,
  };
}

export async function listReviewQueue(
  supabase: AnySupabase,
  tab: ReviewQueueTab,
  options?: { limit?: number; offset?: number },
): Promise<{
  items: ReviewQueueItem[];
  importErrors?: ImportErrorRow[];
  total: number;
}> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  if (tab === "import_errors") {
    const { data, count } = await supabase
      .from("google_sync_run_items")
      .select(
        "id, run_id, salon_id, place_id, business_name, error, created_at",
        { count: "exact" },
      )
      .eq("result", "failed")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return {
      items: [],
      total: count ?? 0,
      importErrors: (data ?? []).map((row) => ({
        id: row.id,
        runId: row.run_id,
        salonId: row.salon_id,
        placeId: row.place_id,
        businessName: row.business_name,
        error: row.error,
        createdAt: row.created_at,
      })),
    };
  }

  if (tab === "duplicates") {
    const { data } = await supabase
      .from("salons")
      .select(QUEUE_SELECT)
      .is("duplicate_of_salon_id", null)
      .order("created_at", { ascending: false })
      .limit(300);

    const rows = asRows(data);
    const items: ReviewQueueItem[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const suggestions = findDuplicateSuggestions(row, rows);
      if (suggestions.length === 0) continue;
      const key = row.id;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(mapQueueItem(row));
      if (items.length >= limit) break;
    }
    return { items, total: items.length };
  }

  let query = supabase
    .from("salons")
    .select(QUEUE_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tab === "newly_imported") {
    query = query.eq("review_status", "pending").eq("source", "google");
  } else if (tab === "updated") {
    // Approved listings whose Google sync is newer than last review.
    const { data: all } = await supabase
      .from("salons")
      .select(QUEUE_SELECT)
      .eq("review_status", "approved")
      .not("google_synced_at", "is", null)
      .order("google_synced_at", { ascending: false })
      .limit(200);

    const filtered = asRows(all).filter((row) => {
      if (!row.google_synced_at) return false;
      if (!row.reviewed_at) return true;
      return row.google_synced_at > row.reviewed_at;
    });
    const page = filtered.slice(offset, offset + limit);
    return {
      items: page.map(mapQueueItem),
      total: filtered.length,
    };
  } else if (tab === "closed") {
    query = query.eq("permanently_closed", true);
  } else if (tab === "missing") {
    query = query
      .eq("source", "google")
      .or("google_business_status.eq.NOT_FOUND,google_place_id.is.null");
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);
  return {
    items: asRows(data).map(mapQueueItem),
    total: count ?? 0,
  };
}

export async function listBusinessHistory(
  supabase: AnySupabase,
  salonId: string,
  limit = 50,
) {
  const { data } = await supabase
    .from("marketplace_business_events")
    .select("*")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    id: row.id,
    salonId: row.salon_id,
    relatedSalonId: row.related_salon_id,
    placeId: row.place_id,
    action: row.action,
    actor: row.actor,
    details:
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : {},
    createdAt: row.created_at,
  }));
}
