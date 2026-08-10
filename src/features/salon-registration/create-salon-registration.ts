import { hash } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSalonPath, resolveCategoryFromService } from "@/features/category";
import type { Database } from "@/types/database";
import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";

import {
  findCatalogueMatches,
  hardCatalogueMatches,
  type CatalogueMatch,
} from "./catalogue-match";
import { FALLBACK_COVER_IMAGE } from "./defaults";
import { ensureUniqueSalonSlug, slugifySalonName } from "./slug";
import type {
  CreateSalonRegistrationInput,
  CreateSalonRegistrationResult,
} from "./types";
import { validateOwner, validateProfile } from "./validate";

type AnySupabase = SupabaseClient<Database>;

async function resolveOrCreateSuburb(
  supabase: AnySupabase,
  input: {
    name: string;
    postcode: string;
    state: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  },
) {
  const name = input.name.trim();
  const { data: existing } = await supabase
    .from("suburbs")
    .select("id, name, postcode, city, state, country, latitude, longitude")
    .ilike("name", name)
    .eq("state", input.state.trim() || "QLD")
    .maybeSingle();

  if (existing) return existing;

  const lat = input.latitude ?? -27.4698;
  const lng = input.longitude ?? 153.0251;

  const { data, error } = await supabase
    .from("suburbs")
    .insert({
      name,
      postcode: input.postcode.trim() || null,
      city: "Brisbane",
      state: input.state.trim() || "QLD",
      country: input.country.trim() || "Australia",
      latitude: lat,
      longitude: lng,
    })
    .select("id, name, postcode, city, state, country, latitude, longitude")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function createAuthUser(
  supabase: AnySupabase,
  input: CreateSalonRegistrationInput,
): Promise<{ authUserId: string; createdAuthUserId: string | null }> {
  let authUserId: string | null = input.authUserId ?? null;
  let createdAuthUserId: string | null = null;
  const ownerEmail = input.owner.ownerEmail.trim().toLowerCase();
  const ownerName = input.owner.ownerName.trim();

  if (!authUserId) {
    const { data: created, error: createAuthError } =
      await supabase.auth.admin.createUser({
        email: ownerEmail,
        password: input.owner.password,
        email_confirm: true,
        user_metadata: { full_name: ownerName },
      });

    if (createAuthError || !created.user) {
      const message =
        createAuthError?.message ?? "Could not create owner login.";
      if (/already|registered|exists/i.test(message)) {
        throw new Error(
          "An account with this email already exists. Please log in, then continue registration.",
        );
      }
      throw new Error(message);
    }
    authUserId = created.user.id;
    createdAuthUserId = created.user.id;
  }

  const { data: existingOwner } = await supabase
    .from("salon_owners")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingOwner) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(
      "This account already owns a verified salon. Open your dashboard instead.",
    );
  }

  const { data: pendingClaim } = await supabase
    .from("salon_claim_requests" as never)
    .select("id" as never)
    .eq("auth_user_id" as never, authUserId)
    .eq("status" as never, "pending")
    .maybeSingle();

  if (pendingClaim) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(
      "You already have a registration under review. Please wait for AllBook approval.",
    );
  }

  return { authUserId, createdAuthUserId };
}

async function insertClaimRequest(
  supabase: AnySupabase,
  input: {
    salonId: string;
    authUserId: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
    matchReasons: string[];
    createdNewSalon: boolean;
    createdAuthUserId: string | null;
  },
) {
  const passwordHash = await hash(input.password, 10);
  const { data, error } = await supabase
    .from("salon_claim_requests" as never)
    .insert({
      salon_id: input.salonId,
      auth_user_id: input.authUserId,
      full_name: input.ownerName,
      email: input.ownerEmail,
      password_hash: passwordHash,
      status: "pending",
      match_reasons: input.matchReasons,
      created_new_salon: input.createdNewSalon,
    } as never)
    .select("id" as never)
    .single();

  if (error || !data) {
    if (input.createdAuthUserId) {
      await supabase.auth.admin.deleteUser(input.createdAuthUserId);
    }
    if (/unique|duplicate/i.test(error?.message ?? "")) {
      throw new Error(
        "A claim for this salon (or this email) is already pending review.",
      );
    }
    throw new Error(error?.message ?? "Could not submit claim request.");
  }

  // Block sign-in until platform admin approves ownership.
  await supabase.auth.admin.updateUserById(input.authUserId, {
    ban_duration: "876000h",
  });

  return (data as { id: string }).id;
}

function buildResult(input: {
  salonId: string;
  authUserId: string;
  slug: string;
  categorySlug: CreateSalonRegistrationResult["categorySlug"];
  claimedExisting: boolean;
  claimRequestId: string;
}): CreateSalonRegistrationResult {
  const publicPath = buildSalonPath(input.categorySlug, input.slug);
  return {
    salonId: input.salonId,
    authUserId: input.authUserId,
    slug: input.slug,
    categorySlug: input.categorySlug,
    publicPath,
    publicUrl: `${PLATFORM_SITE_URL.replace(/\/$/, "")}${publicPath}`,
    dashboardPath: "/register/pending",
    ownershipStatus: "pending_verification",
    reviewRequired: true,
    claimedExisting: input.claimedExisting,
    canLogin: false,
    claimRequestId: input.claimRequestId,
  };
}

async function markSalonPendingVerification(
  supabase: AnySupabase,
  salonId: string,
  method: CreateSalonRegistrationInput["method"],
  opts: { hideFromSearch: boolean },
) {
  const { error } = await supabase
    .from("salons")
    .update({
      ownership_status: "pending_verification",
      claimed: false,
      booking_enabled: false,
      review_status: "pending",
      registration_method: method,
      ...(opts.hideFromSearch ? { marketplace_visible: false } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", salonId);
  if (error) throw new Error(error.message);
}

/**
 * Marketplace registration / claim application.
 * - Hard catalogue match → claim EXISTING salon (keep reviews). No new row.
 * - No match → create hidden salon (not in search) until approved.
 * - salon_owners is created only after admin approval. Pending applicants cannot manage the salon.
 */
export async function createSalonRegistration(
  supabase: AnySupabase,
  input: CreateSalonRegistrationInput,
): Promise<CreateSalonRegistrationResult> {
  const profileError = validateProfile(input.profile);
  if (profileError) throw new Error(profileError);

  const ownerForValidation = {
    ...input.owner,
    confirmPassword: input.owner.password,
  };
  const ownerError = validateOwner(ownerForValidation);
  if (ownerError) throw new Error(ownerError);

  if (!input.owner.acceptedTerms) {
    throw new Error("Please accept the terms to continue.");
  }

  const categorySlug = input.profile.categorySlug;
  if (!categorySlug) throw new Error("Please choose a category.");

  const ownerEmail = input.owner.ownerEmail.trim().toLowerCase();
  const ownerName = input.owner.ownerName.trim();
  const password = input.owner.password;
  const placeId = input.profile.googlePlaceId?.trim() || null;

  const matches = await findCatalogueMatches(supabase, {
    businessName: input.profile.businessName,
    phone: input.profile.phone,
    address: input.profile.address,
    suburb: input.profile.suburb,
    website: input.profile.website,
    googlePlaceId: placeId,
  });
  const hard = hardCatalogueMatches(matches);

  const claimTarget: CatalogueMatch | null =
    hard.find((m) => m.googlePlaceId && placeId && m.googlePlaceId === placeId) ??
    hard[0] ??
    null;

  if (claimTarget) {
    if (claimTarget.claimed || claimTarget.ownershipStatus === "verified") {
      throw new Error(
        "This salon is already claimed by another owner. Contact AllBook support if this is your business.",
      );
    }
    if (claimTarget.ownershipStatus === "pending_verification") {
      // Allow if no pending claim row yet (legacy), otherwise block.
      const { data: existingPending } = await supabase
        .from("salon_claim_requests" as never)
        .select("id" as never)
        .eq("salon_id" as never, claimTarget.id)
        .eq("status" as never, "pending")
        .maybeSingle();
      if (existingPending) {
        throw new Error(
          "A claim for this salon is already under review. Please wait for AllBook to finish verification.",
        );
      }
    }

    const { data: existingOwners } = await supabase
      .from("salon_owners")
      .select("id")
      .eq("salon_id", claimTarget.id)
      .limit(1);
    if ((existingOwners ?? []).length > 0) {
      throw new Error(
        "This salon already has an owner account. Contact AllBook support if this is your business.",
      );
    }

    const { authUserId, createdAuthUserId } = await createAuthUser(
      supabase,
      input,
    );

    const { data: salonRow, error: salonLoadError } = await supabase
      .from("salons")
      .select("id, slug, primary_service")
      .eq("id", claimTarget.id)
      .maybeSingle();

    if (salonLoadError || !salonRow) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      throw new Error(salonLoadError?.message ?? "Salon not found.");
    }

    try {
      // Existing catalogue listing stays searchable; claim is pending only.
      await markSalonPendingVerification(supabase, claimTarget.id, input.method, {
        hideFromSearch: false,
      });
      const claimRequestId = await insertClaimRequest(supabase, {
        salonId: claimTarget.id,
        authUserId,
        ownerName,
        ownerEmail,
        password,
        matchReasons: claimTarget.reasons,
        createdNewSalon: false,
        createdAuthUserId,
      });

      const resolved =
        resolveCategoryFromService(salonRow.primary_service) ??
        resolveCategoryFromService("Hair");
      const resolvedSlug = (categorySlug ||
        resolved?.slug ||
        "hair") as CreateSalonRegistrationResult["categorySlug"];

      return buildResult({
        salonId: claimTarget.id,
        authUserId,
        slug: salonRow.slug,
        categorySlug: resolvedSlug,
        claimedExisting: true,
        claimRequestId,
      });
    } catch (err) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      throw err;
    }
  }

  // Brand-new salon — hidden from marketplace search until ownership is approved.
  const { authUserId, createdAuthUserId } = await createAuthUser(
    supabase,
    input,
  );

  const { data: category, error: categoryError } = await supabase
    .from("business_categories")
    .select("id, slug, name")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryError || !category) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(categoryError?.message ?? "Unknown business category.");
  }

  let suburb;
  try {
    suburb = await resolveOrCreateSuburb(supabase, {
      name: input.profile.suburb,
      postcode: input.profile.postcode,
      state: input.profile.state,
      country: input.profile.country,
      latitude: input.profile.latitude,
      longitude: input.profile.longitude,
    });
  } catch (err) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw err;
  }

  const baseSlug = slugifySalonName(input.profile.businessName);
  const slug = await ensureUniqueSalonSlug(baseSlug, async (candidate) => {
    const { data } = await supabase
      .from("salons")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    return Boolean(data?.id);
  });

  const lat = input.profile.latitude ?? suburb.latitude;
  const lng = input.profile.longitude ?? suburb.longitude;
  const cover = input.profile.coverImage.trim() || FALLBACK_COVER_IMAGE;
  const logo = input.profile.logo.trim() || null;

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .insert({
      category_id: category.id,
      suburb_id: suburb.id,
      name: input.profile.businessName.trim(),
      slug,
      description: input.profile.description.trim() || null,
      phone: input.profile.phone.trim() || null,
      email: input.profile.email.trim() || ownerEmail,
      website: input.profile.website.trim() || null,
      address: input.profile.address.trim(),
      suburb: suburb.name,
      city: suburb.city,
      state: suburb.state,
      postcode: suburb.postcode,
      country: suburb.country,
      latitude: lat,
      longitude: lng,
      cover_image: cover,
      logo,
      rating: 0,
      review_count: 0,
      verified: false,
      claimed: false,
      ownership_status: "pending_verification",
      booking_enabled: false,
      accept_new_customers: true,
      marketplace_visible: false,
      primary_service: category.name,
      starting_price: 0,
      price_min: 0,
      price_max: 0,
      amenities: input.details.amenities,
      service_tags: [category.name],
      opening_hours: input.details.openingHours as Record<string, unknown>,
      registration_method: input.method,
      google_place_id: placeId,
      source: input.method === "google" ? "google" : "owner",
      review_status: "pending",
      social_instagram: input.details.socialInstagram.trim() || null,
      social_facebook: input.details.socialFacebook.trim() || null,
      social_tiktok: input.details.socialTikTok.trim() || null,
      languages: input.details.languages,
    })
    .select("id, slug")
    .single();

  if (salonError || !salon) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(salonError?.message ?? "Could not create salon.");
  }

  try {
    const claimRequestId = await insertClaimRequest(supabase, {
      salonId: salon.id,
      authUserId,
      ownerName,
      ownerEmail,
      password,
      matchReasons: [],
      createdNewSalon: true,
      createdAuthUserId,
    });

    const { ensureDefaultBookingPolicy } = await import(
      "@/features/booking-policy/service"
    );
    await ensureDefaultBookingPolicy(supabase, salon.id);
    const { ensureDefaultSalonSettings } = await import(
      "@/features/business-settings/service"
    );
    await ensureDefaultSalonSettings(supabase, salon.id, ownerEmail);

    if (cover) {
      await supabase.from("salon_images").insert({
        salon_id: salon.id,
        url: cover,
        alt: `${input.profile.businessName} cover`,
        sort_order: 0,
      });
    }

    return buildResult({
      salonId: salon.id,
      authUserId,
      slug: salon.slug,
      categorySlug,
      claimedExisting: false,
      claimRequestId,
    });
  } catch (err) {
    await supabase.from("salons").delete().eq("id", salon.id);
    throw err;
  }
}
