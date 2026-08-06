import { NextResponse } from "next/server";

import {
  aggregateCustomers,
  type CustomerBookingSource,
} from "@/features/admin/lib/customers-report";
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
}): CustomerBookingSource {
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
  };
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_phone, customer_email, customer_postcode, starts_at, price_cents, status, payment_status",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    let customers = aggregateCustomers((data ?? []).map(mapRow));

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
      customers,
      total: customers.length,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
