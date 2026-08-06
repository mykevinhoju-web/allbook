import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { todayIsoSydney } from "./getOwnerSalon";
import type { DashboardStat } from "./types";

type AnySupabase = SupabaseClient<Database>;

export type GetStatsOptions = {
  supabase: AnySupabase;
  salonId: string;
  /** Include monthly revenue when salon payments exist (none today). */
  includeMonthlyRevenue?: boolean;
  monthlyRevenueLabel?: string | null;
};

/**
 * Live KPI cards for the owned salon. No mock / fake trends.
 */
export async function getStats(
  options: GetStatsOptions,
): Promise<DashboardStat[]> {
  const { supabase, salonId } = options;
  const today = todayIsoSydney();

  const [
    todayBookings,
    upcomingBookings,
    customers,
    staff,
    services,
    reviews,
  ] = await Promise.all([
    supabase
      .from("salon_bookings")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("booking_date", today)
      .neq("status", "cancelled"),
    supabase
      .from("salon_bookings")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .gt("booking_date", today)
      .neq("status", "cancelled"),
    supabase
      .from("salon_customers")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId),
    supabase
      .from("salon_staff")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("is_active", true),
    supabase
      .from("salon_services")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId)
      .eq("is_active", true),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salonId),
  ]);

  const stats: DashboardStat[] = [
    {
      id: "todays-bookings",
      label: "Today's Bookings",
      value: String(todayBookings.count ?? 0),
      hint:
        (todayBookings.count ?? 0) === 0
          ? "No bookings scheduled today"
          : undefined,
    },
    {
      id: "upcoming",
      label: "Upcoming Bookings",
      value: String(upcomingBookings.count ?? 0),
      hint:
        (upcomingBookings.count ?? 0) === 0
          ? "No upcoming bookings"
          : "After today",
    },
    {
      id: "customers",
      label: "Customers",
      value: String(customers.count ?? 0),
      hint:
        (customers.count ?? 0) === 0 ? "No customers yet" : undefined,
    },
    {
      id: "staff",
      label: "Staff",
      value: String(staff.count ?? 0),
      hint: (staff.count ?? 0) === 0 ? "No active staff" : "Active",
    },
    {
      id: "services",
      label: "Services",
      value: String(services.count ?? 0),
      hint: (services.count ?? 0) === 0 ? "No active services" : "Active",
    },
    {
      id: "pending-reviews",
      label: "Pending Reviews",
      // No reply/pending column on reviews yet — show 0 honestly.
      value: "0",
      hint:
        (reviews.count ?? 0) === 0
          ? "No reviews yet"
          : `${reviews.count} total · replies coming soon`,
    },
  ];

  if (options.includeMonthlyRevenue && options.monthlyRevenueLabel) {
    stats.push({
      id: "monthly-revenue",
      label: "Monthly Revenue",
      value: options.monthlyRevenueLabel,
      hint: "This month",
    });
  }

  return stats;
}
