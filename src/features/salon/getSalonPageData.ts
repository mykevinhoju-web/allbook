import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type {
  SalonDetail,
  SalonReviewsSummary,
  SalonServiceGroup,
  SalonServiceItem,
  SalonStaffMember,
} from "@/types/salon";

import { getReviews } from "./getReviews";
import { getSalon } from "./getSalon";
import { getServices } from "./getServices";
import { getStaff } from "./getStaff";

type AnySupabase = SupabaseClient<Database>;

export type SalonPageData = {
  salon: SalonDetail;
  services: SalonServiceItem[];
  serviceGroups: SalonServiceGroup[];
  staff: SalonStaffMember[];
  reviews: SalonReviewsSummary;
};

export type GetSalonPageResult =
  | { status: "ok"; data: SalonPageData }
  | { status: "not_found" }
  | { status: "error"; error: string };

/**
 * Aggregate salon detail payload for `/salon/[id]`.
 * Parallel fetches keep TTFB low as salon catalogs grow.
 */
export async function getSalonPageData(
  supabase: AnySupabase,
  salonId: string,
): Promise<GetSalonPageResult> {
  const [salonResult, servicesResult, staffResult, reviewsResult] =
    await Promise.all([
      getSalon(supabase, salonId),
      getServices(supabase, salonId),
      getStaff(supabase, salonId),
      getReviews(supabase, salonId),
    ]);

  if (salonResult.error) {
    return { status: "error", error: salonResult.error };
  }
  if (!salonResult.salon) {
    return { status: "not_found" };
  }

  const firstError =
    servicesResult.error ||
    staffResult.error ||
    reviewsResult.error ||
    null;

  if (firstError) {
    return { status: "error", error: firstError };
  }

  return {
    status: "ok",
    data: {
      salon: salonResult.salon,
      services: servicesResult.services,
      serviceGroups: servicesResult.groups,
      staff: staffResult.staff,
      reviews: reviewsResult.summary,
    },
  };
}
