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
    const spaced = `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
    const withoutLeadingZero = phone.startsWith("0") ? phone.slice(1) : phone;
    const supabase = createServiceSupabase();

    // Any previously saved contact counts (including cancelled bookings).
    // Match common storage variants: digits, spaced, +61 / without leading 0.
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "customer_name, customer_phone, customer_email, customer_postcode, starts_at",
      )
      .eq("tenant_id", tenant.id)
      .not("customer_phone", "is", null)
      .or(
        [
          `customer_phone.eq.${phone}`,
          `customer_phone.eq.${spaced}`,
          `customer_phone.ilike.%${phone}%`,
          `customer_phone.ilike.%${spaced}%`,
          `customer_phone.ilike.%${withoutLeadingZero}%`,
        ].join(","),
      )
      .order("starts_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const row = (data ?? []).find((item) => {
      const digits = normalizeAuMobile(item.customer_phone ?? "");
      if (digits === phone) return true;
      // +61XXXXXXXXX → compare last 9 digits with AU mobile without leading 0
      if (digits.endsWith(withoutLeadingZero) && withoutLeadingZero.length >= 9) {
        return true;
      }
      return false;
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
        phone,
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
