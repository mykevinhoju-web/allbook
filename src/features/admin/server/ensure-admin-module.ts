import { redirect } from "next/navigation";

import { getTenant } from "@/features/tenants/server";

import {
  isAdminModuleEnabled,
  type AdminModuleId,
} from "../lib/admin-modules";

/** Redirect to dashboard when a tenant has disabled this admin module. */
export async function ensureAdminModule(module: AdminModuleId) {
  const tenant = await getTenant();
  if (!isAdminModuleEnabled(tenant, module)) {
    redirect("/admin");
  }
}
