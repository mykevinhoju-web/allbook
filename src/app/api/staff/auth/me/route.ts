import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import { getStaffSessionCookieName, verifyStaffSession } from "@/lib/staff-session";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const cookieStore = await cookies();
    const token = cookieStore.get(getStaffSessionCookieName())?.value;
    if (!token) {
      return NextResponse.json({ staff: null });
    }

    const payload = await verifyStaffSession(token);
    if (!payload || payload.role !== "staff" || payload.tenantId !== tenant.id) {
      return NextResponse.json({ staff: null });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data } = await supabase
      .from("staff")
      .select("id, name")
      .eq("tenant_id", tenant.id)
      .eq("id", payload.staffId)
      .maybeSingle();

    return NextResponse.json({
      staff: data ? { id: data.id, name: data.name } : null,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ staff: null });
  }
}

