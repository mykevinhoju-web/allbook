import { cache } from "react";

import { getTenantSlug } from "./get-tenant-slug";
import { resolveTenantBySlug } from "./resolve-tenant";

/** Request-scoped: layout + metadata share one resolution. */
export const getTenant = cache(async () => {
  const slug = await getTenantSlug();

  if (!slug) {
    throw new Error(
      "getTenant() was called on a platform host without tenant context.",
    );
  }

  return resolveTenantBySlug(slug);
});

/** Request-scoped: layout + metadata share one resolution. */
export const getTenantOptional = cache(async () => {
  const slug = await getTenantSlug();

  if (!slug) {
    return null;
  }

  return resolveTenantBySlug(slug);
});
