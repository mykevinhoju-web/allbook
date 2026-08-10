import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_OWNER_KEYWORD_LIMIT,
  parseOwnerKeywordLimit,
} from "@/features/business";
import type { Database } from "@/types/database";

import type {
  ListBusinessesInput,
  ListBusinessesResult,
  ManagedBusiness,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

const SELECT_COLS =
  "id, name, slug, suburb, city, state, phone, primary_service, rating, review_count, source, claimed, verified, review_status, marketplace_visible, booking_enabled, permanently_closed, google_place_id, imported_at, google_synced_at, updated_at, cover_image, is_synthetic, owner_keyword_limit";

function mapRow(row: {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  primary_service: string | null;
  rating: number;
  review_count: number;
  source: string;
  claimed: boolean;
  verified: boolean;
  review_status: ManagedBusiness["reviewStatus"];
  marketplace_visible: boolean;
  booking_enabled: boolean;
  permanently_closed: boolean;
  google_place_id: string | null;
  imported_at: string | null;
  google_synced_at: string | null;
  updated_at: string;
  cover_image: string | null;
  owner_keyword_limit?: number | null;
}): ManagedBusiness {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    suburb: row.suburb,
    city: row.city,
    state: row.state,
    phone: row.phone,
    primaryService: row.primary_service,
    rating: row.rating,
    reviewCount: row.review_count,
    source: row.source,
    claimed: row.claimed,
    verified: row.verified,
    reviewStatus: row.review_status,
    marketplaceVisible: row.marketplace_visible,
    bookingEnabled: row.booking_enabled,
    permanentlyClosed: row.permanently_closed,
    googlePlaceId: row.google_place_id,
    importedAt: row.imported_at,
    googleSyncedAt: row.google_synced_at,
    updatedAt: row.updated_at,
    coverImage: row.cover_image,
    ownerKeywordLimit: parseOwnerKeywordLimit(
      row.owner_keyword_limit ?? DEFAULT_OWNER_KEYWORD_LIMIT,
    ),
  };
}

/**
 * Platform-admin directory of all marketplace salons (DB catalog).
 */
export async function listManagedBusinesses(
  supabase: AnySupabase,
  input: ListBusinessesInput = {},
): Promise<ListBusinessesResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 40));
  const offset = (page - 1) * pageSize;
  const q = input.q?.trim() ?? "";

  let query = supabase
    .from("salons")
    .select(SELECT_COLS, { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (!input.includeSynthetic) {
    query = query.eq("is_synthetic", false);
  }

  if (q) {
    const safe = q.replace(/[%_,]/g, " ").trim();
    if (safe) {
      query = query.or(
        `name.ilike.%${safe}%,suburb.ilike.%${safe}%,city.ilike.%${safe}%,slug.ilike.%${safe}%,phone.ilike.%${safe}%`,
      );
    }
  }

  if (input.reviewStatus && input.reviewStatus !== "all") {
    query = query.eq("review_status", input.reviewStatus);
  }

  if (input.booking === "on") query = query.eq("booking_enabled", true);
  if (input.booking === "off") query = query.eq("booking_enabled", false);

  if (input.visible === "yes") query = query.eq("marketplace_visible", true);
  if (input.visible === "no") query = query.eq("marketplace_visible", false);

  if (input.source?.trim()) {
    const source = input.source.trim() as
      | "google"
      | "manual"
      | "admin"
      | "owner";
    query = query.eq("source", source);
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const items = (data ?? []).map((row) => mapRow(row));
  const total = count ?? items.length;

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: offset + items.length < total,
  };
}
