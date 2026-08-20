import { NextResponse } from "next/server";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import { expireNamedSessionCookie } from "@/lib/app-session";
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
      const response = NextResponse.json({ user: null });
      expireNamedSessionCookie(
        response,
        getStaffSessionCookieName(),
        request.headers.get("host"),
      );
      return response;
    }

    const supabase = createServiceSupabase();

    const [{ data }, { data: account }] = await Promise.all([
      supabase
        .from("staff")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .eq("id", payload.staffId)
        .maybeSingle(),
      supabase
        .from("staff_accounts")
        .select("session_started_at")
        .eq("tenant_id", tenant.id)
        .eq("staff_id", payload.staffId)
        .maybeSingle(),
    ]);

    // Admin Clear room login / staff logout clears session_started_at — drop stale cookie.
    if (!data || !account?.session_started_at) {
      const response = NextResponse.json({ user: null });
      expireNamedSessionCookie(
        response,
        getStaffSessionCookieName(),
        request.headers.get("host"),
      );
      return response;
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
