import { NextResponse } from "next/server";

import { autoCheckoutExpiredBookings } from "@/features/booking/server/auto-checkout-expired";
import { assignWalkInStaff } from "@/features/booking/server/assign-walk-in-staff";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const { searchParams } = new URL(request.url);
    const durationMinutes = Math.max(
      1,
      Number(searchParams.get("durationMinutes") || 30) || 30,
    );

    const supabase = createServiceSupabase();
    await autoCheckoutExpiredBookings(supabase, { tenantId: tenant.id });

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
    const workDate = todayDateInZone(timeZone, startsAt);

    const assigned = await assignWalkInStaff({
      supabase,
      tenantId: tenant.id,
      timeZone,
      startsAtIso: startsAt.toISOString(),
      endsAtIso: endsAt.toISOString(),
      workDate,
    });

    if (!assigned.ok) {
      return NextResponse.json(
        { error: assigned.error },
        { status: assigned.status },
      );
    }

    const { data: staff } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", assigned.staffId)
      .maybeSingle();

    return NextResponse.json({
      staffId: assigned.staffId,
      staffName: staff?.name ?? "Staff",
      startsAt: startsAt.toISOString(),
      workDate,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
