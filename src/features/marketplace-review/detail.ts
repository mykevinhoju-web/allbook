import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { findDuplicateSuggestions, mapQueueItem } from "./duplicates";
import { listBusinessHistory } from "./queue";
import type {
  BusinessReviewDetail,
  FieldDifference,
  ReviewStatus,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

const DETAIL_SELECT = [
  "id",
  "name",
  "slug",
  "description",
  "phone",
  "email",
  "website",
  "cover_image",
  "logo",
  "address",
  "suburb",
  "city",
  "state",
  "postcode",
  "country",
  "latitude",
  "longitude",
  "rating",
  "review_count",
  "verified",
  "primary_service",
  "amenities",
  "service_tags",
  "opening_hours",
  "source",
  "claimed",
  "category_id",
  "booking_enabled",
  "google_place_id",
  "google_categories",
  "google_photos",
  "google_synced_at",
  "google_business_status",
  "owner_name_override",
  "permanently_closed",
  "review_status",
  "marketplace_visible",
  "duplicate_of_salon_id",
  "reviewed_at",
  "reviewed_by",
  "imported_at",
  "created_at",
  "updated_at",
].join(", ");

function buildDifferences(row: {
  name: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  description: string | null;
  cover_image: string | null;
  logo: string | null;
  google_categories: string[] | null;
  amenities: string[] | null;
}): FieldDifference[] {
  // Google snapshot ≈ listing google-managed columns; AllBook owner fields called out.
  const diffs: FieldDifference[] = [];
  const pairs: Array<[string, string | null, string | null]> = [
    ["description", null, row.description],
    ["cover_image", null, row.cover_image],
    ["logo", null, row.logo],
    [
      "categories",
      (row.google_categories ?? []).join(", ") || null,
      (row.amenities ?? []).length
        ? `amenities: ${(row.amenities ?? []).join(", ")}`
        : null,
    ],
  ];
  for (const [field, google, allbook] of pairs) {
    if ((google ?? "") !== (allbook ?? "")) {
      diffs.push({ field, google, allbook });
    }
  }
  // Surface Google snapshot presence for admin clarity.
  diffs.unshift(
    {
      field: "name",
      google: row.name,
      allbook: row.name,
    },
    {
      field: "phone",
      google: row.phone,
      allbook: row.phone,
    },
    {
      field: "website",
      google: row.website,
      allbook: row.website,
    },
    {
      field: "rating",
      google: String(row.rating ?? 0),
      allbook: String(row.rating ?? 0),
    },
  );
  return diffs;
}

export async function getBusinessReviewDetail(
  supabase: AnySupabase,
  salonId: string,
): Promise<BusinessReviewDetail | null> {
  const { data, error } = await supabase
    .from("salons")
    .select(DETAIL_SELECT)
    .eq("id", salonId)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    cover_image: string | null;
    logo: string | null;
    address: string | null;
    suburb: string | null;
    city: string;
    state: string;
    postcode: string | null;
    country: string;
    latitude: number;
    longitude: number;
    rating: number;
    review_count: number;
    verified: boolean;
    primary_service: string | null;
    amenities: string[];
    service_tags: string[];
    opening_hours: Record<string, unknown> | null;
    source: string;
    claimed: boolean;
    category_id: string | null;
    booking_enabled: boolean;
    google_place_id: string | null;
    google_categories: string[];
    google_photos: unknown;
    google_synced_at: string | null;
    google_business_status: string | null;
    owner_name_override: boolean;
    permanently_closed: boolean;
    review_status: ReviewStatus;
    marketplace_visible: boolean;
    duplicate_of_salon_id: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    imported_at: string | null;
  };

  const [{ data: owner }, history, { data: nearby }] = await Promise.all([
    supabase
      .from("salon_owners")
      .select("id, full_name, email, role")
      .eq("salon_id", salonId)
      .maybeSingle(),
    listBusinessHistory(supabase, salonId),
    supabase
      .from("salons")
      .select(DETAIL_SELECT)
      .neq("id", salonId)
      .is("duplicate_of_salon_id", null)
      .ilike("city", row.city)
      .limit(120),
  ]);

  const candidates = (nearby ?? []) as unknown as Array<
    typeof row & { review_count: number }
  >;
  const duplicates = findDuplicateSuggestions(
    {
      ...row,
      review_count: row.review_count,
      cover_image: row.cover_image,
    },
    candidates.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      suburb: c.suburb,
      city: c.city,
      state: c.state,
      phone: c.phone,
      website: c.website,
      rating: Number(c.rating),
      review_count: c.review_count,
      source: c.source,
      claimed: c.claimed,
      review_status: c.review_status,
      marketplace_visible: c.marketplace_visible,
      permanently_closed: c.permanently_closed,
      google_place_id: c.google_place_id,
      google_business_status: c.google_business_status,
      imported_at: c.imported_at,
      google_synced_at: c.google_synced_at,
      reviewed_at: c.reviewed_at,
      duplicate_of_salon_id: c.duplicate_of_salon_id,
      cover_image: c.cover_image,
      latitude: c.latitude,
      longitude: c.longitude,
    })),
  );

  return {
    salon: {
      ...mapQueueItem({
        ...row,
        review_count: row.review_count,
      }),
      description: row.description,
      address: row.address,
      postcode: row.postcode,
      country: row.country,
      latitude: row.latitude,
      longitude: row.longitude,
      email: row.email,
      logo: row.logo,
      verified: row.verified,
      amenities: row.amenities ?? [],
      serviceTags: row.service_tags ?? [],
      googleCategories: row.google_categories ?? [],
      googlePhotos: row.google_photos,
      openingHours: row.opening_hours,
      ownerNameOverride: row.owner_name_override,
      categoryId: row.category_id,
      primaryService: row.primary_service,
      bookingEnabled: row.booking_enabled,
    },
    googleSnapshot: {
      placeId: row.google_place_id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      website: row.website,
      rating: Number(row.rating ?? 0),
      reviewCount: row.review_count ?? 0,
      categories: row.google_categories ?? [],
      businessStatus: row.google_business_status,
      photos: row.google_photos,
      openingHours: row.opening_hours,
      latitude: row.latitude,
      longitude: row.longitude,
      syncedAt: row.google_synced_at,
    },
    allbookData: {
      description: row.description,
      coverImage: row.cover_image,
      logo: row.logo,
      amenities: row.amenities ?? [],
      serviceTags: row.service_tags ?? [],
      categoryId: row.category_id,
      primaryService: row.primary_service,
      bookingEnabled: row.booking_enabled,
      verified: row.verified,
    },
    differences: buildDifferences(row),
    claimStatus: {
      claimed: row.claimed || Boolean(owner),
      owner: owner
        ? {
            id: owner.id,
            fullName: owner.full_name,
            email: owner.email,
            role: owner.role,
          }
        : null,
    },
    history,
    duplicates,
  };
}
