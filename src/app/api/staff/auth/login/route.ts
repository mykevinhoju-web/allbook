import { NextResponse } from "next/server";

import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import { getAdminSessionCookieName } from "@/lib/admin-session";
import { findStaffAccountsByPin } from "@/lib/staff-pin-auth";
import { validateStaffPin } from "@/lib/staff-pin";
import {
  getStaffSessionCookieName,
  getStaffSessionCookieOptions,
  signStaffSession,
} from "@/lib/staff-session";
import { createServiceSupabase } from "@/lib/supabase/service";
import { markStaffSessionOnline } from "@/features/staff/lib/staff-presence";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as { pin?: string; password?: string };
    const pin = (body.pin ?? body.password ?? "").trim();

    const pinError = validateStaffPin(pin);
    if (pinError) {
      return NextResponse.json({ error: pinError }, { status: 400 });
    }

    const supabase = createServiceSupabase();

    const matches = await findStaffAccountsByPin(supabase, tenant.id, pin);

    if (matches.length === 0) {
      return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
    }

    if (matches.length > 1) {
      return NextResponse.json(
        {
          error:
            "This PIN matches more than one account. Ask your manager to assign a unique PIN.",
        },
        { status: 409 },
      );
    }

    const account = matches[0]!;

    const { data: staff } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", account.staff_id)
      .maybeSingle();

    await markStaffSessionOnline(supabase, {
      tenantId: tenant.id,
      staffId: account.staff_id,
    });

    const token = await signStaffSession({
      role: "staff",
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      staffId: account.staff_id,
      loginId: account.login_id,
    });

    const response = NextResponse.json({
      ok: true,
      staff: { id: account.staff_id, name: staff?.name ?? "Staff" },
    });
    response.cookies.set(
      getStaffSessionCookieName(),
      token,
      getStaffSessionCookieOptions(request.headers.get("host")),
    );
    // Drop admin session so staff portal auth is not overridden on shared devices.
    response.cookies.delete(getAdminSessionCookieName());
    return response;
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error && error.message.includes("STAFF_SESSION_SECRET")) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
