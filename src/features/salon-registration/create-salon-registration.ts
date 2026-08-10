import { hash } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSalonPath, resolveCategoryFromService } from "@/features/category";
import type { Database } from "@/types/database";
import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";

import {
  findCatalogueMatches,
  hardCatalogueMatches,
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
    .select("id, salon_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingOwner) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(
      "This account already owns a salon. Open your dashboard instead.",
    );
  }

  return { authUserId, createdAuthUserId };
}

async function attachOwner(
  supabase: AnySupabase,
  input: {
    salonId: string;
    authUserId: string;
    ownerName: string;
    ownerEmail: string;
    password: string;
    createdAuthUserId: string | null;
  },
) {
  const passwordHash = await hash(input.password, 10);
  const { error } = await supabase.from("salon_owners").insert({
    salon_id: input.salonId,
    full_name: input.ownerName,
    email: input.ownerEmail,
    password_hash: passwordHash,
    auth_user_id: input.authUserId,
    role: "owner",
    accepted_terms_at: new Date().toISOString(),
  });

  if (error) {
    if (input.createdAuthUserId) {
      await supabase.auth.admin.deleteUser(input.createdAuthUserId);
    }
    if (/duplicate|unique/i.test(error.message)) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(error.message);
  }
}

function buildResult(input: {
  salonId: string;
  authUserId: string;
  slug: string;
  categorySlug: CreateSalonRegistrationResult["categorySlug"];
  claimedExisting: boolean;
}): CreateSalonRegistrationResult {
  const publicPath = buildSalonPath(input.categorySlug, input.slug);
  return {
    salonId: input.salonId,
    authUserId: input.authUserId,
    slug: input.slug,
    categorySlug: input.categorySlug,
    publicPath,
    publicUrl: `${PLATFORM_SITE_URL.replace(/\/$/, "")}${publicPath}`,
    dashboardPath: "/platform/salon",
    ownershipStatus: "pending_verification",
    reviewRequired: true,
    claimedExisting: input.claimedExisting,
  };
}

/**
 * Marketplace salon registration / claim:
 * - Google place already in catalogue → claim existing (pending verification)
 * - Manual with hard catalogue overlap → blocked (must claim)
 * - Otherwise create salon as pending_verification (booking off until approved)
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

  // Manual path cannot create a duplicate of a catalogue business.
  if (input.method === "manual" && hard.length > 0) {
    const top = hard[0];
    throw new Error(
      `This business looks like an existing AllBook listing (“${top.name}” in ${[top.suburb, top.city].filter(Boolean).join(", ")}). Please register with Google / claim that listing instead of creating a new one.`,
    );
  }

  // Google (or manual forced claim): attach to existing catalogue salon.
  const claimTarget =
    hard.find((m) => m.googlePlaceId && placeId && m.googlePlaceId === placeId) ??
    (input.method === "google" && hard[0] ? hard[0] : null);

  if (claimTarget) {
    if (claimTarget.claimed || claimTarget.ownershipStatus === "verified") {
      throw new Error(
        "This salon is already claimed by another owner. Contact AllBook support if this is your business.",
      );
    }
    if (claimTarget.ownershipStatus === "pending_verification") {
      throw new Error(
        "A claim for this salon is already under review. Please wait for AllBook to finish verification.",
      );
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
      .select("id, slug, primary_service, category_id")
      .eq("id", claimTarget.id)
      .maybeSingle();

    if (salonLoadError || !salonRow) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      throw new Error(salonLoadError?.message ?? "Salon not found.");
    }

    const { error: updateError } = await supabase
      .from("salons")
      .update({
        ownership_status: "pending_verification",
        claimed: false,
        booking_enabled: false,
        review_status: "pending",
        registration_method: input.method,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimTarget.id);

    if (updateError) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      throw new Error(updateError.message);
    }

    try {
      await attachOwner(supabase, {
        salonId: claimTarget.id,
        authUserId,
        ownerName,
        ownerEmail,
        password,
        createdAuthUserId,
      });
    } catch (err) {
      throw err;
    }

    const { ensureDefaultBookingPolicy } = await import(
      "@/features/booking-policy/service"
    );
    await ensureDefaultBookingPolicy(supabase, claimTarget.id);
    const { ensureDefaultSalonSettings } = await import(
      "@/features/business-settings/service"
    );
    await ensureDefaultSalonSettings(supabase, claimTarget.id, ownerEmail);

    const resolved =
      resolveCategoryFromService(salonRow.primary_service) ??
      resolveCategoryFromService("Hair");
    const resolvedSlug =
      (categorySlug || resolved?.slug || "hair") as CreateSalonRegistrationResult["categorySlug"];

    return buildResult({
      salonId: claimTarget.id,
      authUserId,
      slug: salonRow.slug,
      categorySlug: resolvedSlug,
      claimedExisting: true,
    });
  }

  // Brand-new salon (manual with no overlap, or Google place not yet in catalogue).
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
      marketplace_visible: true,
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
    await attachOwner(supabase, {
      salonId: salon.id,
      authUserId,
      ownerName,
      ownerEmail,
      password,
      createdAuthUserId,
    });
  } catch (err) {
    await supabase.from("salons").delete().eq("id", salon.id);
    throw err;
  }

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
  });
}
