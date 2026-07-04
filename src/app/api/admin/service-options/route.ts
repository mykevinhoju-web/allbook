import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

function mapOption(row: {
  id: string;
  duration_minutes: number;
  price_cents: number;
  sort_order: number;
  is_active: boolean;
}) {
  return {
    id: row.id,
    durationMinutes: row.duration_minutes,
    priceCents: row.price_cents,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();

    const { data, error } = await supabase
      .from("service_options")
      .select("id, duration_minutes, price_cents, sort_order, is_active")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("duration_minutes", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json({
      options: (data ?? []).map(mapOption),
      currency: tenant.settings.currency,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      options?: { durationMinutes?: number; price?: number }[];
    };

    if (!body.options?.length) {
      return NextResponse.json(
        { error: "At least one service option is required." },
        { status: 400 },
      );
    }

    const normalized = body.options.map((option, index) => {
      const durationMinutes = Number(option.durationMinutes);
      const price = Number(option.price);

      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new Error("Each option needs a valid duration in minutes.");
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Each option needs a valid price.");
      }

      return {
        durationMinutes: Math.round(durationMinutes),
        priceCents: Math.round(price * 100),
        sortOrder: index + 1,
      };
    });

    const durations = normalized.map((option) => option.durationMinutes);
    if (new Set(durations).size !== durations.length) {
      return NextResponse.json(
        { error: "Duplicate durations are not allowed." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();

    const { error: deleteError } = await supabase
      .from("service_options")
      .delete()
      .eq("tenant_id", tenant.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 503 });
    }

    const { data, error: insertError } = await supabase
      .from("service_options")
      .insert(
        normalized.map((option) => ({
          tenant_id: tenant.id,
          duration_minutes: option.durationMinutes,
          price_cents: option.priceCents,
          sort_order: option.sortOrder,
        })),
      )
      .select("id, duration_minutes, price_cents, sort_order, is_active");

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 503 });
    }

    revalidateTag("service-options");

    return NextResponse.json({
      options: (data ?? []).map(mapOption),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
