import { NextResponse } from "next/server";

import {
  aggregateRevenueReport,
  compareDateInputs,
  inclusiveDaySpan,
  isValidReportDate,
  MAX_REPORT_RANGE_DAYS,
  reportDateRangeToUtc,
  todayDateInZone,
  type RevenueBookingRow,
} from "@/features/admin/lib/revenue-report";
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

function mapRow(row: {
  id: string;
  staff_id: string;
  starts_at: string;
  price_cents: number;
  status: string;
  customer_name: string | null;
  notes: string | null;
  staff?: { name: string } | { name: string }[] | null;
}): RevenueBookingRow {
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
      status: row.status,
      customerName: row.customer_name,
    };
  }

  return {
    id: row.id,
    staffId: row.staff_id,
    staffName: staffName ?? "Staff",
    startsAt: row.starts_at,
    priceCents: row.price_cents,
    status: row.status,
    customerName: row.customer_name,
  };
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const currency = tenant.settings.currency || "AUD";
    const { searchParams } = new URL(request.url);

    const today = todayDateInZone(timeZone);
    let from = searchParams.get("from")?.trim() || today;
    let to = searchParams.get("to")?.trim() || today;
    const staffId = searchParams.get("staffId")?.trim() || null;

    if (!isValidReportDate(from) || !isValidReportDate(to)) {
      return NextResponse.json(
        { error: "from and to must be YYYY-MM-DD dates." },
        { status: 400 },
      );
    }

    if (compareDateInputs(from, to) > 0) {
      const swap = from;
      from = to;
      to = swap;
    }

    const span = inclusiveDaySpan(from, to);
    if (span > MAX_REPORT_RANGE_DAYS) {
      return NextResponse.json(
        {
          error: `Date range cannot exceed ${MAX_REPORT_RANGE_DAYS} days.`,
        },
        { status: 400 },
      );
    }

    const { rangeStart, rangeEnd } = reportDateRangeToUtc(from, to, timeZone);
    const supabase = createServiceSupabase();

    let query = supabase
      .from("bookings")
      .select(
        "id, staff_id, starts_at, price_cents, status, customer_name, notes, staff(name)",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .in("payment_status", ["paid", "not_required"])
      // Attribute revenue to the booking start day (local).
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd)
      .order("starts_at", { ascending: true });

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const bookings = (data ?? []).map(mapRow);
    const report = aggregateRevenueReport(bookings, timeZone);

    return NextResponse.json({
      currency,
      timezone: timeZone,
      from,
      to,
      staffId,
      ...report,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
