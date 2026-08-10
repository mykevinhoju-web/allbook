import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getPlaceDetails,
  PlaceDetailsError,
  sleep,
} from "@/features/google-import/places-client";
import { buildGoogleSyncSalonPatch } from "@/features/claim-verification";
import { recordBusinessEvent } from "@/features/marketplace-review/record-event";
import type { Database } from "@/types/database";

import {
  buildHashInputFromSnapshot,
  hashGoogleSnapshot,
  listChangedGoogleFields,
} from "./snapshot-hash";
import { hashInputFromSalonRow, mapPlaceToManagedSnapshot } from "./map-managed";
import type { GoogleSyncSalonResult, GoogleSyncSalonRow } from "./types";

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
  "profile_authority",
  "ownership_status",
  "claimed",
].join(", ");

export async function loadSalonForSync(
  supabase: AnySupabase,
  salonId: string,
): Promise<GoogleSyncSalonRow | null> {
  const { data, error } = await supabase
    .from("salons")
    .select(SALON_SYNC_SELECT)
    .eq("id", salonId)
    .not("google_place_id", "is", null)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as GoogleSyncSalonRow;
  if (!row.google_place_id) return null;
  return row;
}

/**
 * Sync one imported salon from Google Place Details.
 * Updates Google-managed fields only. Never overwrites owner-managed data.
 */
export async function syncSalonFromGoogle(
  supabase: AnySupabase,
  salon: GoogleSyncSalonRow,
): Promise<GoogleSyncSalonResult> {
  const placeId = salon.google_place_id;
  const base = {
    salonId: salon.id,
    placeId,
    businessName: salon.name,
  };

  try {
    const place = await getPlaceDetails(placeId);
    const snapshot = mapPlaceToManagedSnapshot(place, salon);
    if (!snapshot) {
      return {
        ...base,
        result: "failed",
        changedFields: [],
        error: "Could not map Place Details response.",
      };
    }

    const hashName = salon.owner_name_override ? salon.name : snapshot.name;
    const after = buildHashInputFromSnapshot(snapshot, hashName);
    const nextHash = hashGoogleSnapshot(after);
    if (salon.google_snapshot_hash === nextHash) {
      return {
        ...base,
        businessName: salon.name,
        result: "unchanged",
        changedFields: [],
      };
    }

    const before = hashInputFromSalonRow({
      ...salon,
      name: hashName,
    });
    const changedFields = listChangedGoogleFields(before, after);

    const now = new Date().toISOString();
    const googlePhotos = snapshot.photos.map((p) => ({
      name: p.name,
      widthPx: p.widthPx ?? null,
      heightPx: p.heightPx ?? null,
    }));

    const authority =
      (salon as { profile_authority?: string }).profile_authority === "owner" ||
      (salon as { ownership_status?: string }).ownership_status === "verified" ||
      (salon as { claimed?: boolean }).claimed
        ? "owner"
        : "catalogue";

    const patch = buildGoogleSyncSalonPatch({
      authority,
      ownerNameOverride: salon.owner_name_override,
      snapshot: {
        name: snapshot.name,
        address: snapshot.address,
        suburb: snapshot.suburb,
        city: snapshot.city,
        state: snapshot.state,
        postcode: snapshot.postcode,
        country: snapshot.country,
        latitude: snapshot.latitude,
        longitude: snapshot.longitude,
        phone: snapshot.phone,
        website: snapshot.website,
        rating: snapshot.rating,
        reviewCount: snapshot.reviewCount,
        openingHours: snapshot.openingHours as Record<string, unknown>,
        googleCategories: snapshot.googleCategories,
        googlePhotos,
        businessStatus: snapshot.businessStatus,
        permanentlyClosed: snapshot.permanentlyClosed,
        snapshotHash: nextHash,
      },
      nowIso: now,
    });

    const { error } = await supabase
      .from("salons")
      .update(patch as never)
      .eq("id", salon.id);

    if (error) {
      return {
        ...base,
        businessName: snapshot.name,
        result: "failed",
        changedFields,
        error: error.message,
      };
    }

    await recordBusinessEvent(supabase, {
      salonId: salon.id,
      placeId,
      action: snapshot.permanentlyClosed ? "permanently_closed" : "synced",
      actor: "google-sync",
      details: { changedFields, permanentlyClosed: snapshot.permanentlyClosed },
    });

    return {
      ...base,
      businessName: salon.owner_name_override ? salon.name : snapshot.name,
      result: snapshot.permanentlyClosed ? "closed" : "updated",
      changedFields,
    };
  } catch (error) {
    if (error instanceof PlaceDetailsError && error.status === 404) {
      const now = new Date().toISOString();
      await supabase
        .from("salons")
        .update({
          google_business_status: "NOT_FOUND",
          google_synced_at: now,
          updated_at: now,
        })
        .eq("id", salon.id);

      return {
        ...base,
        result: "missing",
        changedFields: ["businessStatus"],
        error: "Place no longer found on Google.",
      };
    }

    return {
      ...base,
      result: "failed",
      changedFields: [],
      error: error instanceof Error ? error.message : "Sync failed.",
    };
  }
}

export async function syncSalonById(
  supabase: AnySupabase,
  salonId: string,
): Promise<GoogleSyncSalonResult> {
  const salon = await loadSalonForSync(supabase, salonId);
  if (!salon) {
    return {
      salonId,
      placeId: "",
      businessName: "",
      result: "failed",
      changedFields: [],
      error: "Salon not found or missing google_place_id.",
    };
  }
  return syncSalonFromGoogle(supabase, salon);
}

/** Small pause between Place Details calls to reduce quota spikes. */
export async function syncWithThrottle(
  supabase: AnySupabase,
  salon: GoogleSyncSalonRow,
  delayMs = 80,
): Promise<GoogleSyncSalonResult> {
  const result = await syncSalonFromGoogle(supabase, salon);
  if (delayMs > 0) await sleep(delayMs);
  return result;
}
