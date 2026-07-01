"use client";

import { platformConfig } from "@/config/site";
import { useOptionalTenant } from "@/features/tenants";

export function SiteFooter() {
  const tenant = useOptionalTenant();

  if (!tenant) {
    return (
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {platformConfig.name}
          </p>
          <p>{platformConfig.description}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {tenant.branding.displayName}
        </p>
        <p>
          {tenant.branding.tagline} &middot; Powered by {platformConfig.name}
        </p>
      </div>
    </footer>
  );
}
