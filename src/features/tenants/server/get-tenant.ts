import { getTenantSlug } from "./get-tenant-slug";
import { resolveTenantBySlug } from "./resolve-tenant";

export async function getTenant() {
  const slug = await getTenantSlug();
  return resolveTenantBySlug(slug);
}
