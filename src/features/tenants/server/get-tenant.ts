import { getTenantSlug } from "./get-tenant-slug";
import { resolveTenantBySlug } from "./resolve-tenant";

export async function getTenant() {
  const slug = await getTenantSlug();

  if (!slug) {
    throw new Error(
      "getTenant() was called on a platform host without tenant context.",
    );
  }

  return resolveTenantBySlug(slug);
}

export async function getTenantOptional() {
  const slug = await getTenantSlug();

  if (!slug) {
    return null;
  }

  return resolveTenantBySlug(slug);
}
