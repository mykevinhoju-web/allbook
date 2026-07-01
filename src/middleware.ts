import { type NextRequest } from "next/server";

import { TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "@/features/tenants/constants";
import { isPlatformHost } from "@/features/tenants/utils/resolve-host";
import { resolveTenantSlugFromRequest } from "@/features/tenants/utils/resolve-slug";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const response = await updateSession(request);

  if (isPlatformHost(host)) {
    response.cookies.delete(TENANT_SLUG_COOKIE);
    return response;
  }

  const tenantSlug = resolveTenantSlugFromRequest(request);

  if (tenantSlug) {
    response.headers.set(TENANT_SLUG_HEADER, tenantSlug);
    response.cookies.set(TENANT_SLUG_COOKIE, tenantSlug, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
