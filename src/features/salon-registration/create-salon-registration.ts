import { hash } from "bcryptjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { buildSalonPath, resolveCategoryFromService } from "@/features/category";
import {
  evaluateClaimRisk,
  recordClaimEvent,
  scoreMatchConfidence,
} from "@/features/claim-verification";
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
    emailVerifiedAt: string | null;
    claimantPhone?: string | null;
    cataloguePhone?: string | null;
    hasVerifiedOwner?: boolean;
    priorClaimCount?: number;
    distinctClaimantCount?: number;
    recentClaimCount24h?: number;
  },
) {
  const passwordHash = await hash(input.password, 10);
  const matchConfidence = scoreMatchConfidence({
    reasons: input.matchReasons,
    hard: input.matchReasons.length > 0,
  });

  const phoneMismatch = Boolean(
    input.claimantPhone &&
      input.cataloguePhone &&
      input.claimantPhone.replace(/\D/g, "").slice(-9) !==
        input.cataloguePhone.replace(/\D/g, "").slice(-9),
  );

  const risk = evaluateClaimRisk({
    hasVerifiedOwner: Boolean(input.hasVerifiedOwner),
    priorClaimCount: input.priorClaimCount ?? 0,
    failedAttempts: 0,
    distinctClaimantCount: input.distinctClaimantCount ?? 1,
    recentClaimCount24h: input.recentClaimCount24h ?? 0,
    phoneMismatch,
    websiteMismatch: false,
    claimantDiffers: false,
    onlyGooglePlaceId:
      input.matchReasons.length === 1 &&
      input.matchReasons[0] === "google_place_id",
    emailOnlyNoBusinessControl: true,
  });

  const initialStatus = input.hasVerifiedOwner
    ? "conflict"
    : input.emailVerifiedAt
      ? "business_verification_required"
      : "pending";
  const verificationState = input.hasVerifiedOwner
    ? "conflict"
    : input.emailVerifiedAt
      ? "email_verified"
      : "pending";

  const { data, error } = await supabase
    .from("salon_claim_requests" as never)
    .insert({
      salon_id: input.salonId,
      auth_user_id: input.authUserId,
      full_name: input.ownerName,
      email: input.ownerEmail,
      password_hash: passwordHash,
      status: initialStatus,
      verification_state: verificationState,
      match_reasons: input.matchReasons,
      match_confidence: matchConfidence,
      match_reasons_detail: input.matchReasons.map((r) => ({ reason: r })),
      risk_score: risk.score,
      risk_flags: risk.flags,
      claimant_phone: input.claimantPhone?.trim() || null,
      catalogue_phone_match: input.claimantPhone
        ? !phoneMismatch && Boolean(input.cataloguePhone)
        : null,
      account_email_verified_at: input.emailVerifiedAt,
      postal_fallback_eligible:
        risk.level === "high" || Boolean(input.hasVerifiedOwner),
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

  const claimId = (data as { id: string }).id;

  await recordClaimEvent(supabase, {
    claimId,
    salonId: input.salonId,
    authUserId: input.authUserId,
    event: "claim_created",
    result: initialStatus,
    details: {
      matchReasons: input.matchReasons,
      matchConfidence,
      createdNewSalon: input.createdNewSalon,
    },
  });

  if (input.matchReasons.length > 0) {
    await recordClaimEvent(supabase, {
      claimId,
      salonId: input.salonId,
      authUserId: input.authUserId,
      event: "business_matched",
      result: "matched",
      details: { reasons: input.matchReasons, matchConfidence },
    });
  }

  if (input.emailVerifiedAt) {
    await recordClaimEvent(supabase, {
      claimId,
      salonId: input.salonId,
      authUserId: input.authUserId,
      event: "email_verified",
      verificationMethod: "account_email",
      result: "verified",
    });
  }

  if (input.hasVerifiedOwner) {
    await recordClaimEvent(supabase, {
      claimId,
      salonId: input.salonId,
      authUserId: input.authUserId,
      event: "conflict_detected",
      result: "conflict",
    });
  }

  if (risk.flags.length > 0) {
    await recordClaimEvent(supabase, {
      claimId,
      salonId: input.salonId,
      authUserId: input.authUserId,
      event: "risk_flagged",
      result: risk.level,
      details: { flags: risk.flags, score: risk.score },
    });
  }

  // Claimants must remain able to sign in to complete business-control verification.
  // Owner dashboard stays blocked until ownership is verified (no salon_owners yet).

  return claimId;
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
    dashboardPath: `/register/claim/${input.claimRequestId}`,
    ownershipStatus: "pending_verification",
    reviewRequired: true,
    claimedExisting: input.claimedExisting,
    canLogin: true,
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
      profile_authority: "catalogue",
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
    const { data: existingOwners } = await supabase
      .from("salon_owners")
      .select("id")
      .eq("salon_id", claimTarget.id)
      .limit(1);
    const hasVerifiedOwner =
      (existingOwners ?? []).length > 0 ||
      claimTarget.claimed ||
      claimTarget.ownershipStatus === "verified";

    if (!hasVerifiedOwner && claimTarget.ownershipStatus === "pending_verification") {
      const { data: existingPending } = await supabase
        .from("salon_claim_requests" as never)
        .select("id" as never)
        .eq("salon_id" as never, claimTarget.id)
        .in("status" as never, [
          "pending",
          "email_verified",
          "business_verification_required",
          "business_verified",
        ])
        .maybeSingle();
      if (existingPending) {
        throw new Error(
          "A claim for this salon is already under review. Please wait for AllBook to finish verification.",
        );
      }
    }

    const { authUserId, createdAuthUserId } = await createAuthUser(
      supabase,
      input,
    );

    const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
    const emailVerifiedAt = authUser.user?.email_confirmed_at ?? null;

    const { count: priorClaimCount } = await supabase
      .from("salon_claim_requests" as never)
      .select("id" as never, { count: "exact", head: true })
      .eq("salon_id" as never, claimTarget.id);

    const { data: priorClaimants } = await supabase
      .from("salon_claim_requests" as never)
      .select("auth_user_id" as never)
      .eq("salon_id" as never, claimTarget.id);
    const distinctClaimantCount = new Set(
      [
        ...((priorClaimants as Array<{ auth_user_id: string }> | null) ?? []).map(
          (r) => r.auth_user_id,
        ),
        authUserId,
      ],
    ).size;

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentClaimCount24h } = await supabase
      .from("salon_claim_requests" as never)
      .select("id" as never, { count: "exact", head: true })
      .eq("salon_id" as never, claimTarget.id)
      .gte("created_at" as never, dayAgo);

    const { data: salonRow, error: salonLoadError } = await supabase
      .from("salons")
      .select("id, slug, primary_service, phone")
      .eq("id", claimTarget.id)
      .maybeSingle();

    if (salonLoadError || !salonRow) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId);
      }
      throw new Error(salonLoadError?.message ?? "Salon not found.");
    }

    try {
      // Existing catalogue stays searchable. Do not demote a verified owner salon.
      if (!hasVerifiedOwner) {
        await markSalonPendingVerification(supabase, claimTarget.id, input.method, {
          hideFromSearch: false,
        });
      }

      const claimRequestId = await insertClaimRequest(supabase, {
        salonId: claimTarget.id,
        authUserId,
        ownerName,
        ownerEmail,
        password,
        matchReasons: claimTarget.reasons,
        createdNewSalon: false,
        createdAuthUserId,
        emailVerifiedAt,
        claimantPhone: input.profile.phone,
        cataloguePhone: (salonRow as { phone?: string | null }).phone,
        hasVerifiedOwner,
        priorClaimCount: priorClaimCount ?? 0,
        distinctClaimantCount,
        recentClaimCount24h: recentClaimCount24h ?? 0,
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
      profile_authority: "catalogue",
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
    const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
    const emailVerifiedAt = authUser.user?.email_confirmed_at ?? null;

    const claimRequestId = await insertClaimRequest(supabase, {
      salonId: salon.id,
      authUserId,
      ownerName,
      ownerEmail,
      password,
      matchReasons: [],
      createdNewSalon: true,
      createdAuthUserId,
      emailVerifiedAt,
      claimantPhone: input.profile.phone,
      cataloguePhone: null,
      hasVerifiedOwner: false,
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
