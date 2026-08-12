import { NextResponse } from "next/server";

import {
  aggregateCustomers,
  isValidMonthInput,
  type CustomerBookingSource,
  type CustomersView,
} from "@/features/admin/lib/customers-report";
import { isValidReportDate } from "@/features/admin/lib/revenue-report";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

function mapRow(row: {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_postcode: string | null;
  starts_at: string;
  price_cents: number;
  status: string;
  payment_status: string;
  duration_minutes: number | null;
  staff?: { name: string } | { name: string }[] | null;
}): CustomerBookingSource {
  const staffName = Array.isArray(row.staff)
    ? row.staff[0]?.name
    : row.staff?.name;

  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    customerPostcode: row.customer_postcode,
    startsAt: row.starts_at,
    priceCents: row.price_cents,
    status: row.status,
    paymentStatus: row.payment_status,
    staffName: staffName ?? null,
    durationMinutes: row.duration_minutes,
  };
}

function parseView(value: string | null): CustomersView {
  if (value === "daily" || value === "monthly") return value;
  return "all";
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
    const view = parseView(searchParams.get("view"));
    const today = todayDateInZone(timeZone);

    let date = searchParams.get("date")?.trim() || today;
    let month = searchParams.get("month")?.trim() || today.slice(0, 7);

    if (view === "daily" && !isValidReportDate(date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD." },
        { status: 400 },
      );
    }

    if (view === "monthly" && !isValidMonthInput(month)) {
      return NextResponse.json(
        { error: "month must be YYYY-MM." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_phone, customer_email, customer_postcode, starts_at, price_cents, status, payment_status, duration_minutes, staff(name)",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    let customers = aggregateCustomers((data ?? []).map(mapRow), {
      view,
      timeZone,
      date: view === "daily" ? date : null,
      month: view === "monthly" ? month : null,
    });

    if (query) {
      customers = customers.filter((customer) => {
        const haystack = [
          customer.name,
          customer.phone,
          customer.email,
          customer.postcode,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      });
    }

    return NextResponse.json({
      currency: tenant.settings.currency || "AUD",
      timezone: timeZone,
      view,
      date: view === "daily" ? date : null,
      month: view === "monthly" ? month : null,
      customers,
      total: customers.length,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
