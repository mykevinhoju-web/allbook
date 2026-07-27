import { NextResponse } from "next/server";

import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import { createServiceSupabase } from "@/lib/supabase/service";

/**
 * Vercel Cron + manual maintenance: auto-complete overdue checked-in bookings.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const isVercelCron = request.headers.has("x-vercel-cron");
  const manualToken = url.searchParams.get("token");
  const expectedToken = process.env.MAINTENANCE_TOKEN;

  const authorized =
    isVercelCron ||
    (expectedToken && manualToken && manualToken === expectedToken);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const result = await autoCheckoutExpiredBookings(supabase);

  return NextResponse.json({
    ok: true,
    checkedOut: result.checkedOut,
    bookingIds: result.bookingIds,
  });
}
