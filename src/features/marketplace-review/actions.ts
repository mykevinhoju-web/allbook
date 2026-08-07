import type { SupabaseClient } from "@supabase/supabase-js";

import { syncSalonById } from "@/features/google-sync";
import type { Database } from "@/types/database";

import { getBusinessReviewDetail } from "./detail";
import { recordBusinessEvent } from "./record-event";
import type { ReviewAction } from "./types";

type AnySupabase = SupabaseClient<Database>;

export async function applyReviewAction(
  supabase: AnySupabase,
  input: {
    salonId: string;
    action: ReviewAction;
    actor: string;
    duplicateOfSalonId?: string;
    mergeIntoSalonId?: string;
    note?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { salonId, action, actor } = input;

  const { data: salon, error: loadError } = await supabase
    .from("salons")
    .select("id, name, google_place_id, claimed, review_status")
    .eq("id", salonId)
    .maybeSingle();

  if (loadError || !salon) {
    return { ok: false, error: loadError?.message ?? "Business not found." };
  }

  if (action === "merge") {
    if (!input.mergeIntoSalonId) {
      return { ok: false, error: "mergeIntoSalonId is required." };
    }
    return mergeBusinesses(supabase, {
      primaryId: input.mergeIntoSalonId,
      secondaryId: salonId,
      actor,
      note: input.note,
    });
  }

  if (action === "re_sync") {
    const result = await syncSalonById(supabase, salonId);
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "re_synced",
      actor,
      details: {
        result: result.result,
        changedFields: result.changedFields,
        error: result.error ?? null,
      },
    });
    if (result.result === "failed") {
      return { ok: false, error: result.error ?? "Re-sync failed." };
    }
    return { ok: true };
  }

  if (action === "approve") {
    const { error } = await supabase
      .from("salons")
      .update({
        review_status: "approved",
        marketplace_visible: true,
        verified: true,
        permanently_closed: false,
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "approved",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("salons")
      .update({
        review_status: "rejected",
        marketplace_visible: false,
        verified: false,
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "rejected",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  if (action === "hide") {
    const { error } = await supabase
      .from("salons")
      .update({
        review_status: "hidden",
        marketplace_visible: false,
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "hidden",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  if (action === "restore") {
    const { error } = await supabase
      .from("salons")
      .update({
        review_status: "approved",
        marketplace_visible: true,
        permanently_closed: false,
        verified: true,
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "restored",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  if (action === "permanently_closed") {
    const { error } = await supabase
      .from("salons")
      .update({
        permanently_closed: true,
        marketplace_visible: false,
        google_business_status: "CLOSED_PERMANENTLY",
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      placeId: salon.google_place_id,
      action: "permanently_closed",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  if (action === "mark_duplicate") {
    if (!input.duplicateOfSalonId) {
      return { ok: false, error: "duplicateOfSalonId is required." };
    }
    if (input.duplicateOfSalonId === salonId) {
      return { ok: false, error: "Cannot mark a business as a duplicate of itself." };
    }
    const { error } = await supabase
      .from("salons")
      .update({
        review_status: "duplicate",
        marketplace_visible: false,
        duplicate_of_salon_id: input.duplicateOfSalonId,
        reviewed_at: now,
        reviewed_by: actor,
        updated_at: now,
      })
      .eq("id", salonId);
    if (error) return { ok: false, error: error.message };
    await recordBusinessEvent(supabase, {
      salonId,
      relatedSalonId: input.duplicateOfSalonId,
      placeId: salon.google_place_id,
      action: "marked_duplicate",
      actor,
      details: { note: input.note ?? null },
    });
    return { ok: true };
  }

  return { ok: false, error: `Unknown action: ${action}` };
}

/**
 * Admin-approved merge only. Never automatic.
 * Keeps primary; soft-hides secondary as duplicate.
 * Copies missing Google place id / contact fields onto primary when empty.
 * Never overwrites owner-managed catalog on a claimed primary.
 */
export async function mergeBusinesses(
  supabase: AnySupabase,
  input: {
    primaryId: string;
    secondaryId: string;
    actor: string;
    note?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { primaryId, secondaryId, actor } = input;
  if (primaryId === secondaryId) {
    return { ok: false, error: "Primary and secondary must differ." };
  }

  const { data: rows, error } = await supabase
    .from("salons")
    .select(
      "id, name, phone, website, address, google_place_id, claimed, cover_image, description, logo",
    )
    .in("id", [primaryId, secondaryId]);

  if (error || !rows || rows.length !== 2) {
    return { ok: false, error: error?.message ?? "Both businesses must exist." };
  }

  const primary = rows.find((r) => r.id === primaryId)!;
  const secondary = rows.find((r) => r.id === secondaryId)!;
  const now = new Date().toISOString();

  const patch: Database["public"]["Tables"]["salons"]["Update"] = {
    updated_at: now,
  };

  if (!primary.google_place_id && secondary.google_place_id) {
    patch.google_place_id = secondary.google_place_id;
  }
  if (!primary.phone && secondary.phone) patch.phone = secondary.phone;
  if (!primary.website && secondary.website) patch.website = secondary.website;
  if (!primary.address && secondary.address) patch.address = secondary.address;

  // Clear secondary place id first to satisfy unique index when moving.
  if (patch.google_place_id && secondary.google_place_id) {
    const { error: clearError } = await supabase
      .from("salons")
      .update({ google_place_id: null, updated_at: now })
      .eq("id", secondaryId);
    if (clearError) return { ok: false, error: clearError.message };
  }

  const { error: primaryError } = await supabase
    .from("salons")
    .update(patch)
    .eq("id", primaryId);
  if (primaryError) return { ok: false, error: primaryError.message };

  const { error: secondaryError } = await supabase
    .from("salons")
    .update({
      review_status: "duplicate",
      marketplace_visible: false,
      duplicate_of_salon_id: primaryId,
      google_place_id: null,
      reviewed_at: now,
      reviewed_by: actor,
      updated_at: now,
    })
    .eq("id", secondaryId);
  if (secondaryError) return { ok: false, error: secondaryError.message };

  await recordBusinessEvent(supabase, {
    salonId: primaryId,
    relatedSalonId: secondaryId,
    placeId: primary.google_place_id ?? secondary.google_place_id,
    action: "merged",
    actor,
    details: {
      note: input.note ?? null,
      secondaryName: secondary.name,
      primaryName: primary.name,
    },
  });

  await recordBusinessEvent(supabase, {
    salonId: secondaryId,
    relatedSalonId: primaryId,
    placeId: secondary.google_place_id,
    action: "marked_duplicate",
    actor,
    details: { mergedInto: primaryId, note: input.note ?? null },
  });

  return { ok: true };
}

export async function refreshDetailAfterAction(
  supabase: AnySupabase,
  salonId: string,
) {
  return getBusinessReviewDetail(supabase, salonId);
}
