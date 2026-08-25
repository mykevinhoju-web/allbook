import { NextResponse } from "next/server";

import { todayDateInZone } from "@/features/booking/lib/schedule-utils";
import { isOtherStaffGuestAttributes } from "@/features/booking/lib/booking-other-staff";
import {
  bumpWalkInCountAdjust,
  resolveWalkInCountWorkDate,
} from "@/features/booking/server/assign-walk-in-staff";
import type { StaffAttributes, StaffStatus } from "@/features/staff/types";
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
      staffId?: string;
      step?: number;
    };
    const calendarDate = todayDateInZone(timeZone);
    const staffId = body.staffId?.trim() ?? "";
    const step = body.step === -1 ? -1 : body.step === 1 ? 1 : null;
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
      .select(
        "id, attributes, status, working_hours_start, working_hours_end",
      )
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

    const workDate = resolveWalkInCountWorkDate({
      status: (staffRow.status as StaffStatus) ?? "active",
      attributes: (staffRow.attributes ?? {}) as StaffAttributes,
      calendarDate,
      timeZone,
      workingHoursStart: staffRow.working_hours_start,
      workingHoursEnd: staffRow.working_hours_end,
    });

    const result = await bumpWalkInCountAdjust({
      supabase,
      tenantId: tenant.id,
      workDate,
      timeZone,
      staffId,
      step,
    });

    return NextResponse.json({
      ok: true,
      date: workDate,
      staffId,
      walkInCount: result.walkInCount,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}
