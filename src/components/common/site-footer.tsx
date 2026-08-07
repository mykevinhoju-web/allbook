import Link from "next/link";

import { platformConfig } from "@/config/site";
import {
  PRIVATE_PREVIEW_DOCS_HREF,
  getIsPlatformAdmin,
} from "@/features/private-preview";
import { getTenantOptional } from "@/features/tenants/server";

export async function SiteFooter() {
  const tenant = await getTenantOptional();
  const isPlatformAdmin = await getIsPlatformAdmin();

  if (!tenant) {
    return (
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {platformConfig.name}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p>{platformConfig.description}</p>
            {isPlatformAdmin ? (
              <Link
                href={PRIVATE_PREVIEW_DOCS_HREF}
                className="font-medium text-foreground underline underline-offset-4"
              >
                Documentation
              </Link>
            ) : null}
          </div>
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
        <div className="flex flex-wrap items-center gap-4">
          <p>
            {tenant.branding.tagline} &middot; Powered by {platformConfig.name}
          </p>
          {isPlatformAdmin ? (
            <Link
              href={PRIVATE_PREVIEW_DOCS_HREF}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Documentation
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
