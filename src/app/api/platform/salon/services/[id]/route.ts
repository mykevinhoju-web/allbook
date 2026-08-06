import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { updateService } from "@/features/salon-services/updateService";
import type {
  SalonService,
  ServiceInput,
  ServiceStatus,
} from "@/features/salon-services/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      salonId?: string;
      patch?: Partial<ServiceInput> & { status?: ServiceStatus };
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
    const { data: row, error } = await supabase
      .from("salon_services")
      .select(
        "id, salon_id, category, name, description, duration_minutes, price, price_max, price_type, sort_order, is_active, booking_enabled, featured, status, created_at, updated_at",
      )
      .eq("id", id)
      .eq("salon_id", body.salonId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!row) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    // Minimal current entity for updateService (staff resolved inside).
    const current: SalonService = {
      id: row.id,
      salonId: row.salon_id,
      name: row.name,
      category: row.category as SalonService["category"],
      description: row.description ?? "",
      duration: row.duration_minutes,
      price: row.price,
      priceMax: row.price_max,
      priceType: row.price_type as SalonService["priceType"],
      staffIds: [],
      staff: [],
      displayOrder: row.sort_order,
      status: row.status as ServiceStatus,
      featured: row.featured,
      bookingEnabled: row.booking_enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Preserve staff when patch omits staffIds
    if (!body.patch.staffIds) {
      const { data: links } = await supabase
        .from("salon_staff_services")
        .select("staff_id")
        .eq("service_id", id);
      current.staffIds = (links ?? []).map((l) => l.staff_id);
    }

    const service = await updateService(supabase, current, body.patch);
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update service.",
      },
      { status: 400 },
    );
  }
}
