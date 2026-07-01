import { PlatformLandingPage, TenantHomePage } from "@/components/common";
import { getTenantOptional } from "@/features/tenants/server";

export default async function HomePage() {
  const tenant = await getTenantOptional();

  if (!tenant) {
    return <PlatformLandingPage />;
  }

  return <TenantHomePage tenant={tenant} />;
}
