import { NextResponse } from "next/server";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import { getStaffSessionCookieName, verifyStaffSession } from "@/lib/staff-session";
import { createServiceSupabase } from "@/lib/supabase/service";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const token = readCookieFromRequest(request, getStaffSessionCookieName());
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = await verifyStaffSession(token);
    if (!payload || payload.role !== "staff" || payload.tenantId !== tenant.id) {
      return NextResponse.json({ user: null });
    }

    const supabase = createServiceSupabase();

    const { data } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", payload.staffId)
      .maybeSingle();

    if (!data) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        role: "staff" as const,
        loginId: payload.loginId,
        name: data.name,
        staffId: data.id,
      },
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ user: null });
  }
}
