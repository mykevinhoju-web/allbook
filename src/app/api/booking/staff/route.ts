import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";
import { parseStaffAttributes } from "@/features/staff/utils/attributes";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();

    const { data: staffRows, error } = await supabase
      .from("staff")
      .select(
        "id, name, status, attributes, working_days, working_hours_start, working_hours_end, sort_order",
      )
      .eq("tenant_id", tenant.id)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    const staffIds = staffRows?.map((row) => row.id) ?? [];
    let photos: { staff_id: string; url: string; sort_order: number }[] = [];

    if (staffIds.length > 0) {
      const { data: photoRows } = await supabase
        .from("staff_photos")
        .select("staff_id, url, sort_order")
        .in("staff_id", staffIds);

      photos = photoRows ?? [];
    }

    const staff = (staffRows ?? []).map((row) => {
      const memberPhotos = photos
        .filter((photo) => photo.staff_id === row.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const attributes = parseStaffAttributes(row.attributes as never);
      const photoUrl = memberPhotos[0]?.url ?? null;
      const initials = row.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return {
        id: row.id,
        name: row.name,
        role:
          (typeof attributes.introduction === "string" &&
          attributes.introduction.trim()
            ? attributes.introduction.trim().slice(0, 48)
            : null) ?? "Therapist",
        initials,
        photoUrl: photoUrl ?? "",
        available: row.status === "active",
        workingDays: row.working_days,
        workingHoursStart: row.working_hours_start.slice(0, 5),
        workingHoursEnd: row.working_hours_end.slice(0, 5),
      };
    });

    return NextResponse.json({ staff, currency: tenant.settings.currency });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
