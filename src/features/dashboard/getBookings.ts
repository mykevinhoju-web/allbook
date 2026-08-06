import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { todayIsoSydney } from "./getOwnerSalon";
import type { DashboardBooking, DashboardBookingStatus } from "./types";

type AnySupabase = SupabaseClient<Database>;

export type GetBookingsOptions = {
  supabase: AnySupabase;
  salonId: string;
  scope?: "recent" | "upcoming" | "today" | "all";
  limit?: number;
};

function mapStatus(status: string): DashboardBookingStatus {
  if (status === "confirmed") return "confirmed";
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "cancelled";
  return "pending";
}

function formatTimeLabel(date: string, start: string): string {
  const hhmm = start.slice(0, 5);
  try {
    const day = new Intl.DateTimeFormat("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${date}T12:00:00`));
    return `${day} · ${hhmm}`;
  } catch {
    return `${date} · ${hhmm}`;
  }
}

type BookingJoinRow = {
  id: string;
  booking_date: string;
  start_time: string;
  status: string;
  customer_name: string | null;
  salon_services: { name: string; price: number } | null;
  salon_staff: { display_name: string | null; name: string } | null;
};

function mapRow(row: BookingJoinRow): DashboardBooking {
  const staff =
    row.salon_staff?.display_name?.trim() ||
    row.salon_staff?.name?.trim() ||
    "—";
  const service = row.salon_services?.name ?? "Service";
  const amount = row.salon_services?.price ?? 0;

  return {
    id: row.id,
    customerName: row.customer_name?.trim() || "Customer",
    service,
    staff,
    time: formatTimeLabel(row.booking_date, row.start_time),
    date: row.booking_date,
    status: mapStatus(row.status),
    amount,
  };
}

/**
 * Live bookings for the owned salon only.
 */
export async function getBookings(
  options: GetBookingsOptions,
): Promise<DashboardBooking[]> {
  const { supabase, salonId, scope = "recent", limit = 6 } = options;
  const today = todayIsoSydney();

  let query = supabase
    .from("salon_bookings")
    .select(
      `
      id,
      booking_date,
      start_time,
      status,
      customer_name,
      salon_services ( name, price ),
      salon_staff ( display_name, name )
    `,
    )
    .eq("salon_id", salonId);

  if (scope === "today") {
    query = query.eq("booking_date", today).neq("status", "cancelled");
  } else if (scope === "upcoming") {
    query = query.gt("booking_date", today).neq("status", "cancelled");
  } else if (scope === "recent") {
    query = query.order("booking_date", { ascending: false });
  }

  if (scope === "upcoming" || scope === "today") {
    query = query
      .order("booking_date", { ascending: true })
      .order("start_time", { ascending: true });
  } else {
    query = query.order("start_time", { ascending: false });
  }

  query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as BookingJoinRow[]).map(mapRow);
}
