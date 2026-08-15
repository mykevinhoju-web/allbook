import { NextResponse } from "next/server";

import { isValidReportDate } from "@/features/admin/lib/revenue-report";
import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "@/features/booking/lib/booking-other-staff";
import { bumpWalkInCountAdjust } from "@/features/booking/server/assign-walk-in-staff";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/admin/tenant-context";

export async function PATCH(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const timeZone = tenant.settings.timezone || "Australia/Sydney";
    const body = (await request.json()) as {
      date?: string;
      staffId?: string;
      step?: number;
    };
    const date = body.date?.trim() || todayDateInZone(timeZone);
    const staffId = body.staffId?.trim() ?? "";
    const step = body.step === -1 ? -1 : body.step === 1 ? 1 : null;

    if (!isValidReportDate(date)) {
      return NextResponse.json(
        { error: "date must be YYYY-MM-DD." },
        { status: 400 },
      );
    }
    if (!staffId) {
      return NextResponse.json({ error: "staffId is required." }, { status: 400 });
    }
    if (step == null) {
      return NextResponse.json(
        { error: "step must be 1 or -1." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { data: staffRow, error: staffError } = await supabase
      .from("staff")
      .select("id, attributes, status")
      .eq("tenant_id", tenant.id)
      .eq("id", staffId)
      .maybeSingle();

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 503 });
    }
    if (
      !staffRow ||
      staffRow.status !== "active" ||
      isOtherStaffGuestAttributes(staffRow.attributes)
    ) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const result = await bumpWalkInCountAdjust({
      supabase,
      tenantId: tenant.id,
      workDate: date,
      timeZone,
      staffId,
      step,
    });

    return NextResponse.json({
      ok: true,
      date,
      staffId,
      walkInCount: result.walkInCount,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
