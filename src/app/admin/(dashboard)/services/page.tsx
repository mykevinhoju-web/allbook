import { EverAdminServicesContent } from "@/features/ever/admin/ever-admin-services";
import { isEverTenant } from "@/features/ever";
import { ServicePricingContent } from "@/features/services";
import { getTenantOptional } from "@/features/tenants/server";

export default async function AdminServicesPage() {
  const tenant = await getTenantOptional();
  if (tenant && isEverTenant(tenant.slug)) {
    return <EverAdminServicesContent />;
  }
  return <ServicePricingContent />;
}
