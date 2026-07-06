import { cache } from "react";
import { cookies, headers } from "next/headers";

import { TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "../constants";
import { resolveDevTenantSlugFromEnv } from "../utils/dev-tenant";
import { isPlatformHost } from "../utils/resolve-host";
import { resolveTenantSlugFromHost } from "../utils/resolve-slug";

/** Request-scoped slug resolution (headers/cookies read once per request). */
export const getTenantSlug = cache(async (): Promise<string | null> => {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "";

  if (isPlatformHost(host)) {
    return resolveDevTenantSlugFromEnv();
  }

  const headerSlug = headerStore.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return headerSlug;
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(TENANT_SLUG_COOKIE)?.value;
  if (cookieSlug) {
    return cookieSlug;
  }

  const hostSlug = resolveTenantSlugFromHost(host);
  if (hostSlug) {
    return hostSlug;
  }

  return null;
});
