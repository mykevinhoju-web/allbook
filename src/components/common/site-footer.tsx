"use client";

import { platformConfig } from "@/config/site";
import { useTenant } from "@/features/tenants";

export function SiteFooter() {
  const tenant = useTenant();

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
