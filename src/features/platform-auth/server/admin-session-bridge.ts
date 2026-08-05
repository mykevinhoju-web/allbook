import { TENANT_SLUG_COOKIE } from "@/features/tenants/constants";
import { getTenantAdminUrl } from "@/features/tenants/utils/resolve-host";
import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  signAdminSession,
} from "@/lib/admin-session";
import { NextResponse } from "next/server";

type BridgeInput = {
  tenantId: string;
  tenantSlug: string;
  adminId: string;
  loginId: string;
  host: string | null;
};

export async function createAdminSessionResponse(input: BridgeInput) {
  const token = await signAdminSession({
    role: "admin",
    tenantSlug: input.tenantSlug,
    tenantId: input.tenantId,
    adminId: input.adminId,
    loginId: input.loginId,
  });

  // Land on the tenant admin dashboard: allbook.com.au/{slug}/admin
  const redirectTo = getTenantAdminUrl(input.tenantSlug);

  const response = NextResponse.json({
    ok: true,
    redirectTo,
    tenantSlug: input.tenantSlug,
  });

  response.cookies.set(
    getAdminSessionCookieName(),
    token,
    getAdminSessionCookieOptions(input.host),
  );

  response.cookies.set(TENANT_SLUG_COOKIE, input.tenantSlug, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365 * 10,
  });

  return response;
}
