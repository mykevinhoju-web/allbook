import { notFound } from "next/navigation";

import { getTenantOptional } from "@/features/tenants/server";

/** Ever landing WIP is only available on the everwellmassage tenant. */
export async function requireEverTenant() {
  const tenant = await getTenantOptional();
  if (!tenant || tenant.slug !== "everwellmassage") {
    notFound();
  }
  return tenant;
}
