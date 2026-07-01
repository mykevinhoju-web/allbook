import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { appButtonVariants } from "@/components/common";
import { getPrimaryTenantSlug } from "@/config/featured-tenants";
import { platformConfig } from "@/config/site";
import { getTenantAdminUrl, getTenantPublicUrl } from "@/features/tenants";
import { cn } from "@/lib/utils";

export function TenantAdminGateway() {
  const slug = getPrimaryTenantSlug();
  const tenantAdminUrl = getTenantAdminUrl(slug);
  const tenantHost = getTenantPublicUrl(slug).replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="max-w-lg space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Tenant Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Open your business admin on a tenant subdomain
        </h1>
        <p className="text-sm text-muted-foreground">
          {platformConfig.name} platform pages live on{" "}
          <strong>allbook.com.au</strong>. Each business manages staff and
          bookings from its own subdomain — for example{" "}
          <strong>{tenantHost}/admin</strong>.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={tenantAdminUrl}
          className={cn(appButtonVariants({ variant: "primary" }))}
        >
          <ExternalLink className="size-4" />
          Tenant Admin
        </Link>
        <Link
          href="/platform"
          className={cn(appButtonVariants({ variant: "outline" }))}
        >
          Platform Admin
        </Link>
      </div>
    </div>
  );
}
