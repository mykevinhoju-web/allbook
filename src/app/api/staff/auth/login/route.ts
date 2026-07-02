import { compare } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Database } from "@/types/database";
import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import {
  getStaffSessionCookieName,
  getStaffSessionCookieOptions,
  signStaffSession,
} from "@/lib/staff-session";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as { loginId?: string; password?: string };

    if (!body.loginId?.trim() || !body.password) {
      return NextResponse.json(
        { error: "loginId and password are required." },
        { status: 400 },
      );
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: account, error } = await supabase
      .from("staff_accounts")
      .select("staff_id, password_hash")
      .eq("tenant_id", tenant.id)
      .eq("login_id", body.loginId.trim())
      .maybeSingle();

    if (error || !account) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await compare(body.password, account.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signStaffSession({
      role: "staff",
      tenantSlug: tenant.slug,
      tenantId: tenant.id,
      staffId: account.staff_id,
      loginId: body.loginId.trim(),
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      getStaffSessionCookieName(),
      token,
      getStaffSessionCookieOptions(),
    );
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

