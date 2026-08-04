import { NextResponse } from "next/server";

import { createAdminSessionResponse } from "@/features/platform-auth/server/admin-session-bridge";
import {
  findAdminAccountForTenant,
  findMembershipForAuthUser,
  provisionPlatformTenant,
} from "@/features/platform-auth/server/provision-tenant";
import { createClient } from "@/lib/supabase/server";

/**
 * After OAuth / magic-link: if membership exists → admin session;
 * if completing first-time social signup → provision tenant.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Sign in first, then continue." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      fullName?: string;
      phone?: string;
      businessName?: string;
      businessType?: string;
    };

    const existing = await findMembershipForAuthUser(user.id);
    if (existing) {
      const admin =
        (await findAdminAccountForTenant(existing.tenantId, user.email)) ??
        (await findAdminAccountForTenant(existing.tenantId, user.email.toLowerCase()));

      if (!admin) {
        return NextResponse.json(
          { error: "Admin access is not set up for this account." },
          { status: 403 },
        );
      }

      return createAdminSessionResponse({
        tenantId: existing.tenantId,
        tenantSlug: existing.tenantSlug,
        adminId: admin.id,
        loginId: admin.login_id,
        host: request.headers.get("host"),
      });
    }

    const fullName =
      body.fullName?.trim() ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : "") ||
      (typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "");
    const phone =
      body.phone?.trim() ||
      (typeof user.user_metadata?.phone === "string"
        ? user.user_metadata.phone
        : "");

    if (
      !fullName ||
      !phone ||
      !body.businessName?.trim() ||
      !body.businessType?.trim()
    ) {
      return NextResponse.json(
        {
          error: "complete_profile",
          needsProfile: true,
          email: user.email,
          fullName,
          phone,
        },
        { status: 428 },
      );
    }

    const provisioned = await provisionPlatformTenant({
      fullName,
      phone,
      businessName: body.businessName,
      businessType: body.businessType,
      email: user.email,
      authUserId: user.id,
    });

    return createAdminSessionResponse({
      tenantId: provisioned.tenantId,
      tenantSlug: provisioned.tenantSlug,
      adminId: provisioned.adminId,
      loginId: provisioned.loginId,
      host: request.headers.get("host"),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not continue sign-in.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
