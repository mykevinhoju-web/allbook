import { NextResponse } from "next/server";

import {
  DEFAULT_BOOKING_TIMEZONE,
  formatShiftDateTime,
  getSlotsInShiftWindow,
} from "@/features/booking/lib/schedule-utils";
import {
  getShiftWindowFromAttributes,
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const durationMinutes = Number(searchParams.get("durationMinutes"));

    if (!staffId) {
      return NextResponse.json({ error: "staffId is required." }, { status: 400 });
    }

    if (!durationMinutes || Number.isNaN(durationMinutes)) {
      return NextResponse.json(
        { error: "durationMinutes is required." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();

    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("id, name, status, attributes")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError || !staffRow) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const attributes = parseStaffAttributes(staffRow.attributes as never);
    const { shiftStartsAt, shiftEndsAt } =
      getShiftWindowFromAttributes(attributes);

    if (!shiftStartsAt || !shiftEndsAt) {
      return NextResponse.json({
        slots: [],
        booked: [],
        shiftStartsAt: null,
        shiftEndsAt: null,
        reason: "No availability window is set for this staff member.",
      });
    }

    if (staffRow.status !== "active") {
      return NextResponse.json({
        slots: [],
        booked: [],
        shiftStartsAt,
        shiftEndsAt,
        reason: "Staff is not available.",
      });
    }

    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, starts_at, ends_at, customer_name, status")
      .eq("tenant_id", tenant.id)
      .eq("staff_id", staffId)
      .neq("status", "cancelled")
      .lt("starts_at", shiftEndsAt)
      .gt("ends_at", shiftStartsAt)
      .order("starts_at", { ascending: true });

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 503 });
    }

    const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const bookingRows = bookings ?? [];
    const slots = getSlotsInShiftWindow(
      shiftStartsAt,
      shiftEndsAt,
      durationMinutes,
      bookingRows.map((row) => ({
        startsAt: row.starts_at,
        endsAt: row.ends_at,
      })),
      { timeZone },
    );

    const booked = bookingRows.map((row) => ({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      customerName: row.customer_name,
      label: `${formatShiftDateTime(row.starts_at, timeZone)} – ${formatShiftDateTime(row.ends_at, timeZone)}`,
    }));

    return NextResponse.json({
      slots,
      booked,
      shiftStartsAt,
      shiftEndsAt,
      timeZone,
      shiftLabel: `${formatShiftDateTime(shiftStartsAt, timeZone)} → ${formatShiftDateTime(shiftEndsAt, timeZone)}`,
      reason:
        slots.length === 0
          ? "No open times left in this availability window."
          : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
