import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import {
  mapBreaks,
  mapLeaves,
  mapStaffRow,
  mapWorkingHours,
  type StaffRow,
} from "@/features/salon-staff/map-staff";
import { updateStaff } from "@/features/salon-staff/updateStaff";
import type {
  SalonStaffMember,
  StaffInput,
  StaffStatus,
} from "@/features/salon-staff/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function loadCurrentStaff(
  supabase: ReturnType<typeof createServiceSupabase>,
  id: string,
  salonId: string,
): Promise<SalonStaffMember | null> {
  const { data: row, error } = await supabase
    .from("salon_staff")
    .select("*")
    .eq("id", id)
    .eq("salon_id", salonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const [hoursRes, breaksRes, leavesRes, linksRes] = await Promise.all([
    supabase
      .from("salon_staff_working_hours")
      .select("day_of_week, start_time, end_time, is_day_off")
      .eq("staff_id", id),
    supabase
      .from("salon_staff_breaks")
      .select("id, day_of_week, start_time, end_time, break_type, label")
      .eq("staff_id", id),
    supabase
      .from("salon_staff_leaves")
      .select("id, start_date, end_date, leave_type, reason")
      .eq("staff_id", id),
    supabase
      .from("salon_staff_services")
      .select("service_id")
      .eq("staff_id", id),
  ]);

  if (hoursRes.error) throw new Error(hoursRes.error.message);
  if (breaksRes.error) throw new Error(breaksRes.error.message);
  if (leavesRes.error) throw new Error(leavesRes.error.message);
  if (linksRes.error) throw new Error(linksRes.error.message);

  const serviceIds = (linksRes.data ?? []).map((l) => l.service_id);
  let services: SalonStaffMember["services"] = [];
  if (serviceIds.length > 0) {
    const { data: serviceRows } = await supabase
      .from("salon_services")
      .select("id, name, category")
      .eq("salon_id", salonId)
      .in("id", serviceIds);
    services = (serviceRows ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
    }));
  }

  return mapStaffRow(row as StaffRow, {
    workingHours: mapWorkingHours(hoursRes.data ?? []),
    breaks: mapBreaks(breaksRes.data ?? []),
    leaves: mapLeaves(leavesRes.data ?? []),
    services,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      salonId?: string;
      patch?: Partial<StaffInput> & { status?: StaffStatus };
    };

    if (!body.salonId || !body.patch) {
      return NextResponse.json(
        { error: "salonId and patch are required." },
        { status: 400 },
      );
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owns = await ownerOwnsSalon(user.id, body.salonId, session);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const current = await loadCurrentStaff(supabase, id, body.salonId);
    if (!current) {
      return NextResponse.json({ error: "Staff not found." }, { status: 404 });
    }

    const staff = await updateStaff(supabase, current, body.patch);
    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update staff.",
      },
      { status: 400 },
    );
  }
}
