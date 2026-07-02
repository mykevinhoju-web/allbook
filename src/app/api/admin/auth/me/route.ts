import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { requireTenantFromRequest, TenantContextError } from "@/lib/admin/tenant-context";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-session";
import {
  getStaffSessionCookieName,
  verifyStaffSession,
} from "@/lib/staff-session";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const cookieStore = await cookies();

    const adminToken = cookieStore.get(getAdminSessionCookieName())?.value;
    if (adminToken) {
      const admin = await verifyAdminSession(adminToken);
      if (admin && admin.tenantId === tenant.id) {
        return NextResponse.json({
          user: {
            role: "admin" as const,
            loginId: admin.loginId,
            name: "Admin",
          },
        });
      }
    }

    const staffToken = cookieStore.get(getStaffSessionCookieName())?.value;
    if (staffToken) {
      const staff = await verifyStaffSession(staffToken);
      if (staff && staff.tenantId === tenant.id) {
        const supabase = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY ??
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        );

        const { data } = await supabase
          .from("staff")
          .select("name")
          .eq("tenant_id", tenant.id)
          .eq("id", staff.staffId)
          .maybeSingle();

        return NextResponse.json({
          user: {
            role: "staff" as const,
            loginId: staff.loginId,
            name: data?.name ?? "Staff",
            staffId: staff.staffId,
          },
        });
      }
    }

    return NextResponse.json({ user: null });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ user: null });
  }
}
