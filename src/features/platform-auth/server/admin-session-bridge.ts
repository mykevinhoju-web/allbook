import {
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
  signAdminSession,
} from "@/lib/admin-session";
import { getTenantPublicUrl } from "@/features/tenants/utils/resolve-host";
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

  const tenantOrigin = getTenantPublicUrl(input.tenantSlug);
  const redirectTo = `${tenantOrigin}/api/platform/auth/accept-handoff?token=${encodeURIComponent(token)}`;

  const response = NextResponse.json({
    ok: true,
    redirectTo,
    tenantSlug: input.tenantSlug,
  });

  // Also set on current host (helps when apex shares .allbook.com.au domain).
  response.cookies.set(
    getAdminSessionCookieName(),
    token,
    getAdminSessionCookieOptions(input.host),
  );

  return response;
}
