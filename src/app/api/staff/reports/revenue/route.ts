import { NextResponse } from "next/server";

import {
  aggregateRevenueReport,
  compareDateInputs,
  inclusiveDaySpan,
  isValidReportDate,
  MAX_REPORT_RANGE_DAYS,
  reportDateRangeToUtc,
  todayDateInZone,
  resolveStaffPayoutCents,
  type RevenueBookingRow,
} from "@/features/admin/lib/revenue-report";
import {
  isOtherStaffBooking,
  parseOtherStaffName,
} from "@/features/booking/lib/booking-other-staff";
import { isWalkInBooking } from "@/features/booking/lib/walk-in-rotation";
import { splitRevenueCents } from "@/features/booking/lib/internal-payment-method";
import { loadStaffPayoutByDuration } from "@/features/services/server/get-service-price";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { StaffAuthError, requireStaffSession } from "@/lib/server/require-staff-session";

function mapRow(
  row: {
    id: string;
    staff_id: string;
    starts_at: string;
    duration_minutes: number;
    price_cents: number;
    staff_payout_cents: number | null;
    status: string;
    payment_status: string;
    customer_name: string | null;
    notes: string | null;
    staff?: { name: string } | { name: string }[] | null;
  },
  payoutByDuration: Map<number, number>,
): RevenueBookingRow {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;

  const { cashCents, cardCents } = splitRevenueCents({
    priceCents: row.price_cents,
    paymentStatus: row.payment_status,
    notes: row.notes,
  });

  const staffPayoutCents = resolveStaffPayoutCents(
    row.staff_payout_cents,
    row.duration_minutes,
    payoutByDuration,
  );

  const base = {
    id: row.id,
    staffId: row.staff_id,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    staffPayoutCents,
    status: row.status,
    customerName: row.customer_name,
    cashCents,
    cardCents,
    walkIn: isWalkInBooking(row.notes),
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
    const tenant = await requireTenantFromRequest(request);
    const session = await requireStaffSession(tenant.id, request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const currency = tenant.settings.currency || "AUD";
    const { searchParams } = new URL(request.url);

    const today = todayDateInZone(timeZone);
    let from = searchParams.get("from")?.trim() || today;
    let to = searchParams.get("to")?.trim() || today;

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

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, staff_id, starts_at, duration_minutes, price_cents, staff_payout_cents, status, payment_status, customer_name, notes, staff(name)",
      )
      .eq("tenant_id", tenant.id)
      .eq("staff_id", session.staffId)
      .neq("status", "cancelled")
      .in("payment_status", ["paid", "not_required"])
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd)
      .order("starts_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const payoutByDuration = await loadStaffPayoutByDuration(
      supabase,
      tenant.id,
    );
    const bookings = (data ?? []).map((row) => mapRow(row, payoutByDuration));
    const report = aggregateRevenueReport(bookings, timeZone);

    return NextResponse.json({
      currency,
      timezone: timeZone,
      from,
      to,
      staffId: session.staffId,
      ...report,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof StaffAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
