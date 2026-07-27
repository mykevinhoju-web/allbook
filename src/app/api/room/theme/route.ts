import { NextResponse } from "next/server";

import {
  mergePortalTheme,
  parsePortalTheme,
} from "@/features/portal-theme";
import {
  createServiceSupabase,
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

/** Fresh room chrome colors — bypasses the 5-minute tenant cache. */
export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("tenants")
      .select("settings")
      .eq("id", tenant.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings =
      data?.settings &&
      typeof data.settings === "object" &&
      !Array.isArray(data.settings)
        ? (data.settings as Record<string, unknown>)
        : {};

    const saved = parsePortalTheme(settings.portalTheme);

    return NextResponse.json({
      portalTheme: mergePortalTheme(saved ?? tenant.settings.portalTheme),
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to load theme." }, { status: 500 });
  }
}
