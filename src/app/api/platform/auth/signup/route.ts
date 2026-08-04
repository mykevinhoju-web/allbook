import { NextResponse } from "next/server";

import { createAdminSessionResponse } from "@/features/platform-auth/server/admin-session-bridge";
import {
  findAdminAccountForTenant,
  provisionPlatformTenant,
} from "@/features/platform-auth/server/provision-tenant";
import { isPlatformHost } from "@/features/tenants/utils/resolve-host";

export async function POST(request: Request) {
  try {
    const host = request.headers.get("host") ?? "";
    if (!isPlatformHost(host) && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Sign up on allbook.com.au." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      fullName?: string;
      phone?: string;
      businessName?: string;
      businessType?: string;
      email?: string;
    };

    const provisioned = await provisionPlatformTenant({
      fullName: body.fullName ?? "",
      phone: body.phone ?? "",
      businessName: body.businessName ?? "",
      businessType: body.businessType ?? "",
      email: body.email ?? "",
    });

    const admin =
      (await findAdminAccountForTenant(
        provisioned.tenantId,
        provisioned.loginId,
      )) ?? { id: provisioned.adminId, login_id: provisioned.loginId };

    return createAdminSessionResponse({
      tenantId: provisioned.tenantId,
      tenantSlug: provisioned.tenantSlug,
      adminId: admin.id,
      loginId: admin.login_id,
      host: request.headers.get("host"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create account.";
    const status = /already exists/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
