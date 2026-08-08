import type { SupabaseClient } from "@supabase/supabase-js";

import { recordBusinessEvent } from "@/features/marketplace-review/record-event";
import type { Database } from "@/types/database";

import type { ManagedBusiness, PatchBusinessInput } from "./types";

type AnySupabase = SupabaseClient<Database>;

const SELECT_COLS =
  "id, name, slug, suburb, city, state, phone, primary_service, rating, review_count, source, claimed, verified, review_status, marketplace_visible, booking_enabled, permanently_closed, google_place_id, imported_at, google_synced_at, updated_at, cover_image";

/**
 * Platform-admin patch for marketplace visibility + online booking flag.
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
    .select("id, google_place_id, booking_enabled, marketplace_visible, review_status")
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

  if (
    patch.bookingEnabled === undefined &&
    patch.marketplaceVisible === undefined &&
    patch.reviewStatus === undefined &&
    patch.verified === undefined
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
      },
    },
  });

  return {
    ok: true,
    business: {
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
    },
  };
}
