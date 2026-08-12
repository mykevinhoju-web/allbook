import { NextResponse } from "next/server";

import {
  buildDashboardStats,
  dashboardQueryRange,
  yesterdayDateInZone,
  type DashboardBookingRow,
  type DashboardStaffRow,
} from "@/features/admin/lib/dashboard-stats";
import { todayDateInZone } from "@/features/admin/lib/revenue-report";
import {
  isOtherStaffBooking,
  OTHER_STAFF_SENTINEL,
} from "@/features/booking/lib/booking-other-staff";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import type { StaffStatus } from "@/features/staff/types";

function mapBooking(row: {
  id: string;
  staff_id: string;
  starts_at: string;
  price_cents: number;
  notes: string | null;
  staff?: { name: string } | { name: string }[] | null;
}): DashboardBookingRow {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;

  if (isOtherStaffBooking(row.notes)) {
    return {
      id: row.id,
      staffId: OTHER_STAFF_SENTINEL,
      staffName: "Other Staff",
      startsAt: row.starts_at,
      priceCents: row.price_cents,
    };
  }

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: staffName ?? "Staff",
    startsAt: row.starts_at,
    priceCents: row.price_cents,
  };
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const currency = tenant.settings.currency || "AUD";
    const today = todayDateInZone(timeZone);
    const yesterday = yesterdayDateInZone(timeZone);
    const { rangeStart, rangeEnd } = dashboardQueryRange(
      today,
      yesterday,
      timeZone,
    );

    const supabase = createServiceSupabase();

    const [bookingsResult, staffResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, staff_id, starts_at, price_cents, notes, staff(name)")
        .eq("tenant_id", tenant.id)
        .neq("status", "cancelled")
        .gte("starts_at", rangeStart)
        .lt("starts_at", rangeEnd)
        .order("starts_at", { ascending: true }),
      supabase
        .from("staff")
        .select("id, name, status, attributes")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    if (bookingsResult.error) {
      return NextResponse.json(
        { error: bookingsResult.error.message },
        { status: 503 },
      );
    }

    if (staffResult.error) {
      return NextResponse.json(
        { error: staffResult.error.message },
        { status: 503 },
      );
    }

    const bookings = (bookingsResult.data ?? []).map(mapBooking);
    const staff: DashboardStaffRow[] = (staffResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status as StaffStatus,
      attributes: row.attributes,
    }));

    const stats = buildDashboardStats({
      today,
      yesterday,
      timeZone,
      bookings,
      staff,
    });

    return NextResponse.json({
      currency,
      timezone: timeZone,
      ...stats,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
