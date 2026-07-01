import { cookies, headers } from "next/headers";

import { TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "../constants";
import { resolveTenantSlugFromEnv } from "../utils/resolve-slug";

export async function getTenantSlug(): Promise<string> {
  const headerStore = await headers();
  const headerSlug = headerStore.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return headerSlug;
  }

  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get(TENANT_SLUG_COOKIE)?.value;
  if (cookieSlug) {
    return cookieSlug;
  }

  return resolveTenantSlugFromEnv();
}
