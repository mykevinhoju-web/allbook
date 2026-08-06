import { getBookings } from "./getBookings";
import { getStats } from "./getStats";
import {
  MOCK_CALENDAR_SLOTS,
  MOCK_PERFORMANCE,
  MOCK_QUICK_ACTIONS,
  MOCK_REVIEW_SUMMARY,
  MOCK_SALON_SESSION,
} from "./mock-data";
import type { SalonDashboardData } from "./types";

/** Aggregates salon owner home dashboard data (mock-backed). */
export async function getDashboard(): Promise<SalonDashboardData> {
  const [stats, recentBookings, upcoming] = await Promise.all([
    getStats(),
    getBookings({ scope: "recent", limit: 6 }),
    getBookings({ scope: "upcoming", limit: 3 }),
  ]);

  return {
    session: MOCK_SALON_SESSION,
    stats,
    performance: MOCK_PERFORMANCE,
    recentBookings,
    upcoming,
    calendar: MOCK_CALENDAR_SLOTS,
    reviews: MOCK_REVIEW_SUMMARY,
    quickActions: MOCK_QUICK_ACTIONS,
  };
}
