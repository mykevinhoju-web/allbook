import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import {
  isHexColor,
  mergePortalTheme,
  parsePortalTheme,
  type PortalThemeFieldKey,
  PORTAL_THEME_FIELDS,
} from "@/features/portal-theme";
import { invalidateDevTenantCache } from "@/features/tenants/server/resolve-tenant";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    return NextResponse.json({
      portalTheme: mergePortalTheme(tenant.settings.portalTheme),
    });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    return NextResponse.json({ error: "Failed to load theme." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant, actor } = await requireTenantAndAdminActor(request);
    if (actor.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = (await request.json()) as { portalTheme?: unknown };
    const incoming = body.portalTheme;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json(
        { error: "portalTheme object is required." },
        { status: 400 },
      );
    }

    const nextTheme: Record<PortalThemeFieldKey, string> = {
      ...mergePortalTheme(undefined),
    };
    const raw = incoming as Record<string, unknown>;
    for (const field of PORTAL_THEME_FIELDS) {
      const value = raw[field.key];
      if (!isHexColor(value)) {
        return NextResponse.json(
          { error: `Invalid color for ${field.key}. Use #RRGGBB.` },
          { status: 400 },
        );
      }
      nextTheme[field.key] = value.toLowerCase();
    }

    const supabase = createServiceSupabase();
    const { data: row, error: readError } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant.id)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    const currentSettings =
      row?.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
        ? (row.settings as Record<string, unknown>)
        : {};

    const { error: writeError } = await supabase
      .from("tenants")
      .update({
        settings: {
          ...currentSettings,
          portalTheme: nextTheme,
        },
      })
      .eq("id", tenant.id);

    if (writeError) {
      return NextResponse.json({ error: writeError.message }, { status: 500 });
    }

    revalidateTag(`tenant:${tenant.slug}`);
    revalidateTag("tenants");
    revalidatePath("/room");
    revalidatePath("/room/login");
    invalidateDevTenantCache(tenant.slug);

    return NextResponse.json({
      portalTheme: parsePortalTheme(nextTheme) ?? nextTheme,
    });
  } catch (error) {
    const handled = handleAdminRouteError(error);
    if (handled) return handled;
    return NextResponse.json({ error: "Failed to save theme." }, { status: 500 });
  }
}
