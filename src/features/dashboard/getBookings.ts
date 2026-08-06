import {
  MOCK_RECENT_BOOKINGS,
  MOCK_UPCOMING_BOOKINGS,
} from "./mock-data";
import type { DashboardBooking } from "./types";

export type GetBookingsOptions = {
  scope?: "recent" | "upcoming" | "all";
  limit?: number;
};

/** Salon owner bookings list — mock for now (no booking logic). */
export async function getBookings(
  options: GetBookingsOptions = {},
): Promise<DashboardBooking[]> {
  const { scope = "recent", limit } = options;

  let rows: DashboardBooking[] = [];
  if (scope === "upcoming") rows = MOCK_UPCOMING_BOOKINGS;
  else if (scope === "all") {
    rows = [...MOCK_RECENT_BOOKINGS, ...MOCK_UPCOMING_BOOKINGS];
  } else {
    rows = MOCK_RECENT_BOOKINGS;
  }

  if (typeof limit === "number") return rows.slice(0, limit);
  return rows;
}
