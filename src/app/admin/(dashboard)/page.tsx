import { AdminDashboardContent } from "@/features/admin";
import { EverAdminDashboardContent } from "@/features/ever/admin/ever-admin-dashboard";
import { isEverTenant } from "@/features/ever";
import { getTenantOptional } from "@/features/tenants/server";

export default async function AdminDashboardPage() {
  const tenant = await getTenantOptional();
  if (tenant && isEverTenant(tenant.slug)) {
    return <EverAdminDashboardContent />;
  }
  return <AdminDashboardContent />;
}
