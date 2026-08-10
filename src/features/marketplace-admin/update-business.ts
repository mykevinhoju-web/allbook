import type { SupabaseClient } from "@supabase/supabase-js";

import {
  approveSalonClaim,
  rejectSalonClaim,
} from "@/features/salon-registration/approve-claim";
import {
  DEFAULT_OWNER_KEYWORD_LIMIT,
  parseOwnerKeywordLimit,
} from "@/features/business";
import { recordBusinessEvent } from "@/features/marketplace-review/record-event";
import type { Database } from "@/types/database";

import type { ManagedBusiness, PatchBusinessInput } from "./types";

type AnySupabase = SupabaseClient<Database>;

const SELECT_COLS =
  "id, name, slug, suburb, city, state, phone, primary_service, rating, review_count, source, claimed, verified, review_status, marketplace_visible, booking_enabled, permanently_closed, google_place_id, imported_at, google_synced_at, updated_at, cover_image, owner_keyword_limit, ownership_status";

function mapBusiness(data: {
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
  ownership_status?: string | null;
}): ManagedBusiness {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    suburb: data.suburb,
    city: data.city,
    state: data.state,
    phone: data.phone,
    primaryService: data.primary_service,
    rating: data.rating,
    reviewCount: data.review_count,
    source: data.source,
    claimed: data.claimed,
    verified: data.verified,
    reviewStatus: data.review_status,
    marketplaceVisible: data.marketplace_visible,
    bookingEnabled: data.booking_enabled,
    permanentlyClosed: data.permanently_closed,
    googlePlaceId: data.google_place_id,
    importedAt: data.imported_at,
    googleSyncedAt: data.google_synced_at,
    updatedAt: data.updated_at,
    coverImage: data.cover_image,
    ownerKeywordLimit: parseOwnerKeywordLimit(
      data.owner_keyword_limit ?? DEFAULT_OWNER_KEYWORD_LIMIT,
    ),
    ownershipStatus: data.ownership_status ?? "unclaimed",
  };
}

/**
 * Platform-admin patch for marketplace visibility, booking, and paid keyword slots.
 */
export async function patchManagedBusiness(
  supabase: AnySupabase,
  input: {
    salonId: string;
    patch: PatchBusinessInput;
    actor: string;
  },
): Promise<{ ok: true; business: ManagedBusiness } | { ok: false; error: string }> {
  const { salonId, patch, actor } = input;
  const now = new Date().toISOString();

  const { data: existing, error: loadError } = await supabase
    .from("salons")
    .select(
      "id, google_place_id, booking_enabled, marketplace_visible, review_status, owner_keyword_limit, ownership_status, claimed",
    )
    .eq("id", salonId)
    .maybeSingle();

  if (loadError || !existing) {
    return { ok: false, error: loadError?.message ?? "Business not found." };
  }

  const update: {
    updated_at: string;
    booking_enabled?: boolean;
    marketplace_visible?: boolean;
    review_status?: ManagedBusiness["reviewStatus"];
    reviewed_at?: string;
    reviewed_by?: string;
    verified?: boolean;
    owner_keyword_limit?: number;
    ownership_status?: string;
    claimed?: boolean;
  } = { updated_at: now };
  if (patch.bookingEnabled !== undefined) {
    update.booking_enabled = patch.bookingEnabled;
  }
  if (patch.marketplaceVisible !== undefined) {
    update.marketplace_visible = patch.marketplaceVisible;
  }
  if (patch.reviewStatus !== undefined) {
    update.review_status = patch.reviewStatus;
    update.reviewed_at = now;
    update.reviewed_by = actor;
  }
  if (patch.verified !== undefined) {
    update.verified = patch.verified;
  }
  if (patch.ownerKeywordLimit !== undefined) {
    update.owner_keyword_limit = parseOwnerKeywordLimit(patch.ownerKeywordLimit);
  }
  if (patch.ownershipStatus !== undefined) {
    if (patch.ownershipStatus === "verified") {
      const approved = await approveSalonClaim(supabase, {
        salonId,
        actor,
      });
      if (!approved.ok) {
        // Fall back to direct status update when no claim row (legacy).
        update.ownership_status = "verified";
        update.claimed = true;
        update.verified = true;
        update.review_status = "approved";
        update.reviewed_at = now;
        update.reviewed_by = actor;
        update.marketplace_visible = true;
      } else {
        const { data: refreshed, error: refreshError } = await supabase
          .from("salons")
          .select(SELECT_COLS)
          .eq("id", salonId)
          .single();
        if (refreshError || !refreshed) {
          return { ok: false, error: refreshError?.message ?? "Refresh failed." };
        }
        await recordBusinessEvent(supabase, {
          salonId,
          placeId: existing.google_place_id,
          action: "claimed",
          actor,
          details: { source: "platform-businesses", patch },
        });
        return { ok: true, business: mapBusiness(refreshed) };
      }
    } else if (patch.ownershipStatus === "rejected") {
      const rejected = await rejectSalonClaim(supabase, {
        salonId,
        actor,
      });
      if (!rejected.ok) {
        update.ownership_status = "rejected";
        update.claimed = false;
        update.booking_enabled = false;
        update.reviewed_at = now;
        update.reviewed_by = actor;
      } else {
        const { data: refreshed, error: refreshError } = await supabase
          .from("salons")
          .select(SELECT_COLS)
          .eq("id", salonId)
          .single();
        if (refreshError || !refreshed) {
          return { ok: false, error: refreshError?.message ?? "Refresh failed." };
        }
        return { ok: true, business: mapBusiness(refreshed) };
      }
    } else {
      update.ownership_status = patch.ownershipStatus;
    }
  }

  if (
    patch.bookingEnabled === undefined &&
    patch.marketplaceVisible === undefined &&
    patch.reviewStatus === undefined &&
    patch.verified === undefined &&
    patch.ownerKeywordLimit === undefined &&
    patch.ownershipStatus === undefined
  ) {
    return { ok: false, error: "No changes provided." };
  }

  const { data, error } = await supabase
    .from("salons")
    .update(update)
    .eq("id", salonId)
    .select(SELECT_COLS)
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Update failed." };
  }

  await recordBusinessEvent(supabase, {
    salonId,
    placeId: existing.google_place_id,
    action: "updated",
    actor,
    details: {
      source: "platform-businesses",
      patch,
      before: {
        booking_enabled: existing.booking_enabled,
        marketplace_visible: existing.marketplace_visible,
        review_status: existing.review_status,
        owner_keyword_limit: existing.owner_keyword_limit,
      },
    },
  });

  return {
    ok: true,
    business: mapBusiness(data),
  };
}
