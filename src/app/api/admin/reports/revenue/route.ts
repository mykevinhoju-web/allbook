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
  parseOtherStaffName,
} from "@/features/booking/lib/booking-other-staff";
import { splitRevenueCents } from "@/features/booking/lib/internal-payment-method";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { isAdminReportsUnlocked } from "@/lib/admin-reports-unlock";

function mapRow(row: {
  id: string;
  staff_id: string;
  starts_at: string;
  price_cents: number;
  status: string;
  payment_status: string;
  customer_name: string | null;
  notes: string | null;
  staff?: { name: string } | { name: string }[] | null;
}): RevenueBookingRow {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;

  const { cashCents, cardCents } = splitRevenueCents({
    priceCents: row.price_cents,
    paymentStatus: row.payment_status,
    notes: row.notes,
  });

  const base = {
    id: row.id,
    staffId: row.staff_id,
    startsAt: row.starts_at,
    priceCents: row.price_cents,
    status: row.status,
    customerName: row.customer_name,
    cashCents,
    cardCents,
  };

  if (isOtherStaffBooking(row.notes)) {
    const otherName =
      parseOtherStaffName(row.notes) ?? staffName?.trim() ?? null;
    return {
      ...base,
      staffName: otherName
        ? `Other Staff · ${otherName}`
        : "Other Staff",
    };
  }

  return {
    ...base,
    staffName: staffName ?? "Staff",
  };
}

export async function GET(request: Request) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request);
    if (
      actor.role !== "admin" ||
      !(await isAdminReportsUnlocked(request, {
        tenantId: tenant.id,
        adminId: actor.adminId,
      }))
    ) {
      return NextResponse.json(
        {
          error: "Enter the admin password to view reports.",
          code: "REPORTS_LOCKED",
        },
        { status: 403 },
      );
    }

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
        "id, staff_id, starts_at, price_cents, status, payment_status, customer_name, notes, staff(name)",
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
