import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import {
  mergePricingAdjustments,
  parsePricingAdjustments,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import { invalidateDevTenantCache } from "@/features/tenants/server/resolve-tenant";
import {
  createServiceSupabase,
} from "@/lib/admin/tenant-context";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import type { Json } from "@/types/database";

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

function normalizePricingAdjustments(raw: unknown): PricingAdjustments {
  if (raw === undefined) {
    return mergePricingAdjustments(undefined);
  }

  const parsed = parsePricingAdjustments(raw);
  if (!parsed) {
    throw new Error("Invalid pricing adjustments.");
  }

  return mergePricingAdjustments(parsed);
}

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
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
      pricingAdjustments: mergePricingAdjustments(
        tenant.settings.pricingAdjustments,
      ),
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const body = (await request.json()) as {
      options?: { durationMinutes?: number; price?: number }[];
      pricingAdjustments?: unknown;
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

    const pricingAdjustments =
      body.pricingAdjustments !== undefined
        ? normalizePricingAdjustments(body.pricingAdjustments)
        : mergePricingAdjustments(tenant.settings.pricingAdjustments);

    const supabase = createServiceSupabase();

    const { data: settingsRow, error: settingsReadError } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant.id)
      .maybeSingle();

    if (settingsReadError) {
      return NextResponse.json(
        { error: settingsReadError.message },
        { status: 503 },
      );
    }

    const currentSettings =
      settingsRow?.settings &&
      typeof settingsRow.settings === "object" &&
      !Array.isArray(settingsRow.settings)
        ? (settingsRow.settings as Record<string, unknown>)
        : {};

    const { error: settingsWriteError } = await supabase
      .from("tenants")
      .update({
        settings: {
          ...currentSettings,
          pricingAdjustments,
        } as Json,
      })
      .eq("id", tenant.id);

    if (settingsWriteError) {
      return NextResponse.json(
        { error: settingsWriteError.message },
        { status: 503 },
      );
    }

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
    revalidateTag(`tenant:${tenant.slug}`);
    revalidateTag("tenants");
    invalidateDevTenantCache(tenant.slug);

    return NextResponse.json({
      options: (data ?? []).map(mapOption),
      pricingAdjustments,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
