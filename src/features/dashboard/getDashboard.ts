import { createClient } from "@/lib/supabase/server";

import { getBookings } from "./getBookings";
import {
  getOwnerSalonContext,
  type OwnerSalonContext,
} from "./getOwnerSalon";
import { getStats } from "./getStats";
import { DASHBOARD_QUICK_ACTIONS } from "./quick-actions";
import type {
  DashboardCalendarSlot,
  DashboardPerformanceMetric,
  DashboardReviewSummary,
  SalonDashboardData,
} from "./types";

export { DASHBOARD_QUICK_ACTIONS } from "./quick-actions";

async function buildCalendar(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string,
): Promise<DashboardCalendarSlot[]> {
  const bookings = await getBookings({
    supabase,
    salonId,
    scope: "today",
    limit: 24,
  });

  if (bookings.length === 0) return [];

  return bookings.map((b) => ({
    time: b.time.includes("·") ? b.time.split("·")[1]!.trim() : b.time,
    booking: {
      id: b.id,
      customerName: b.customerName,
      service: b.service,
      staff: b.staff,
    },
  }));
}

async function buildReviews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  salonId: string,
  salonRating: number,
  salonReviewCount: number,
): Promise<DashboardReviewSummary> {
  const { data: latest } = await supabase
    .from("reviews")
    .select("rating, comment, author_name")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const highlight =
    latest?.comment?.trim() ||
    (salonReviewCount > 0
      ? "Latest review has no written comment."
      : "");

  return {
    averageRating: Number(salonRating) || Number(latest?.rating) || 0,
    pendingCount: 0,
    totalReviews: salonReviewCount,
    recentHighlight: highlight,
  };
}

/**
 * Live salon owner home dashboard.
 * auth.uid() → salon_owners.auth_user_id → salon → live aggregates.
 */
export async function getDashboard(
  existing?: OwnerSalonContext,
): Promise<
  | { status: "unauthenticated" }
  | { status: "error"; error: string }
  | { status: "no_salon" }
  | { status: "pending_claim" }
  | { status: "ok"; data: SalonDashboardData }
> {
  const context = existing ?? (await getOwnerSalonContext());

  if (context.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  if (context.status === "error") {
    return { status: "error", error: context.error };
  }
  if (context.status === "no_salon") {
    return { status: "no_salon" };
  }
  if (context.status === "pending_claim") {
    return { status: "pending_claim" };
  }

  const supabase = await createClient();
  const salonId = context.salon.id;

  const [stats, recentBookings, upcoming, calendar, reviews] =
    await Promise.all([
      getStats({ supabase, salonId, includeMonthlyRevenue: false }),
      getBookings({ supabase, salonId, scope: "recent", limit: 8 }),
      getBookings({ supabase, salonId, scope: "upcoming", limit: 5 }),
      buildCalendar(supabase, salonId),
      buildReviews(
        supabase,
        salonId,
        context.salon.rating,
        context.salon.review_count,
      ),
    ]);

  const performance: DashboardPerformanceMetric[] = [];

  return {
    status: "ok",
    data: {
      session: context.session,
      stats,
      performance,
      recentBookings,
      upcoming,
      calendar,
      reviews,
      quickActions: DASHBOARD_QUICK_ACTIONS,
    },
  };
}
