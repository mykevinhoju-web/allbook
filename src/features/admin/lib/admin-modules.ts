import type { Tenant } from "@/features/tenants/types";

import { adminNavItems } from "../config/navigation";
import type { AdminNavItem } from "../types";

export type AdminModuleId = "customers" | "gallery" | "settings";

export interface TenantAdminModules {
  customers?: boolean;
  gallery?: boolean;
  settings?: boolean;
}

/** Hidden when tenant settings set `adminModules.<id>: false`. */
export function isAdminModuleEnabled(
  tenant: Tenant,
  module: AdminModuleId,
): boolean {
  const modules = tenant.settings.adminModules;
  if (!modules) return true;
  return modules[module] !== false;
}

export function getAdminNavItemsForTenant(
  tenant: Tenant,
  options: { isStaff?: boolean } = {},
): AdminNavItem[] {
  if (options.isStaff) {
    return adminNavItems.filter((item) => item.href === "/admin/bookings");
  }

  return adminNavItems.filter((item) => {
    if (!item.module) return true;
    return isAdminModuleEnabled(tenant, item.module);
  });
}
