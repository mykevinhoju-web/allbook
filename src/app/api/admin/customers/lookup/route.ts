import { NextResponse } from "next/server";

import {
  isValidAuMobile,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import { parseCustomerBookingName } from "@/features/booking/lib/customer-booking-name";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request, {
      allowStaff: true,
    });
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone")?.trim() ?? "";

    if (!isValidAuMobile(rawPhone)) {
      return NextResponse.json({ customer: null });
    }

    const phone = normalizeAuMobile(rawPhone);
    const supabase = createServiceSupabase();

    // Phones are stored normalized; also match spaced display variants.
    const spaced = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "customer_name, customer_phone, customer_email, customer_postcode, starts_at",
      )
      .eq("tenant_id", tenant.id)
      .neq("status", "cancelled")
      .or(`customer_phone.eq.${phone},customer_phone.eq.${spaced}`)
      .order("starts_at", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const row = (data ?? []).find((item) => {
      const digits = normalizeAuMobile(item.customer_phone ?? "");
      return digits === phone;
    });

    if (!row) {
      return NextResponse.json({ customer: null });
    }

    const { firstName, secondName } = parseCustomerBookingName(row.customer_name);

    return NextResponse.json({
      customer: {
        name: row.customer_name,
        firstName,
        secondName,
        phone: normalizeAuMobile(row.customer_phone ?? phone),
        email: row.customer_email?.trim() || null,
        postcode: row.customer_postcode?.trim() || null,
      },
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
