import { EVER_TENANT_SLUG } from "../config";
import { getTenantOptional } from "@/features/tenants/server";
import { notFound } from "next/navigation";

/** Ever routes only resolve on everwellmassage.com.au (or local dev with tenant env). */
export async function requireEverTenant() {
  const tenant = await getTenantOptional();
  if (!tenant || tenant.slug !== EVER_TENANT_SLUG) {
    notFound();
  }
  return tenant;
}
