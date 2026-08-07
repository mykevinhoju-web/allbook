import { hash } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSalonPath } from "@/features/category";
import type { Database } from "@/types/database";
import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";

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

/**
 * Marketplace salon registration:
 * 1) Supabase Auth user
 * 2) salons row (from form — never demo)
 * 3) salon_owners { salon_id, auth_user_id, role: owner }
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

  // 1. Auth user first (reuse session user when already signed in)
  let authUserId: string | null = input.authUserId ?? null;
  let createdAuthUserId: string | null = null;

  if (!authUserId) {
    const { data: created, error: createAuthError } =
      await supabase.auth.admin.createUser({
        email: ownerEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: ownerName,
        },
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

  // Block registering a second salon for the same auth user
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

  const { data: category, error: categoryError } = await supabase
    .from("business_categories")
    .select("id, slug, name")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryError) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error(categoryError.message);
  }
  if (!category) {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw new Error("Unknown business category.");
  }

  const suburb = await resolveOrCreateSuburb(supabase, {
    name: input.profile.suburb,
    postcode: input.profile.postcode,
    state: input.profile.state,
    country: input.profile.country,
    latitude: input.profile.latitude,
    longitude: input.profile.longitude,
  }).catch(async (err) => {
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    throw err;
  });

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

  // 2. Real salon from registration form
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
      primary_service: category.name,
      starting_price: 0,
      price_min: 0,
      price_max: 0,
      amenities: input.details.amenities,
      service_tags: [category.name],
      opening_hours: input.details.openingHours as Record<string, unknown>,
      registration_method: input.method,
      google_place_id: input.profile.googlePlaceId,
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

  const passwordHash = await hash(password, 10);

  // 3. salon_owners link
  const { error: ownerErrorInsert } = await supabase.from("salon_owners").insert({
    salon_id: salon.id,
    full_name: ownerName,
    email: ownerEmail,
    password_hash: passwordHash,
    auth_user_id: authUserId,
    role: "owner",
    accepted_terms_at: new Date().toISOString(),
  });

  if (ownerErrorInsert) {
    await supabase.from("salons").delete().eq("id", salon.id);
    if (createdAuthUserId) {
      await supabase.auth.admin.deleteUser(createdAuthUserId);
    }
    if (/duplicate|unique/i.test(ownerErrorInsert.message)) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(ownerErrorInsert.message);
  }

  // Default Booking Only policy — accept bookings without payment setup.
  const { ensureDefaultBookingPolicy } = await import(
    "@/features/booking-policy/service"
  );
  await ensureDefaultBookingPolicy(supabase, salon.id);

  if (cover) {
    await supabase.from("salon_images").insert({
      salon_id: salon.id,
      url: cover,
      alt: `${input.profile.businessName} cover`,
      sort_order: 0,
    });
  }

  const publicPath = buildSalonPath(categorySlug, slug);

  return {
    salonId: salon.id,
    authUserId,
    slug,
    categorySlug,
    publicPath,
    publicUrl: `${PLATFORM_SITE_URL.replace(/\/$/, "")}${publicPath}`,
    dashboardPath: "/platform/salon",
  };
}
