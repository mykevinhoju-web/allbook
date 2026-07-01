import Link from "next/link";
import { ArrowRight, Building2, LayoutDashboard } from "lucide-react";

import { appButtonVariants } from "@/components/common";
import { getFeaturedTenants } from "@/config/featured-tenants";
import { platformConfig } from "@/config/site";
import { getTenantPublicUrl } from "@/features/tenants";
import { cn } from "@/lib/utils";

export function PlatformLandingPage() {
  const featuredTenants = getFeaturedTenants();
  const primaryTenant = featuredTenants[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-20">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Multi-tenant booking platform
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {platformConfig.name} powers wellness &amp; beauty businesses
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {platformConfig.description} Manage tenants, subscriptions, and
          bookings from one platform — or visit a tenant site to book services.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/platform"
            className={cn(appButtonVariants({ variant: "primary" }))}
          >
            <LayoutDashboard className="size-4" />
            Platform Admin
          </Link>
          {primaryTenant ? (
            <Link
              href={primaryTenant.publicUrl}
              className={cn(appButtonVariants({ variant: "outline" }))}
            >
              Visit {primaryTenant.name}
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Tenants</h2>
          <p className="text-sm text-muted-foreground">
            Each business runs on its own branded subdomain.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featuredTenants.map((tenant) => (
            <article
              key={tenant.slug}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-lg font-semibold">{tenant.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tenant.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTenantPublicUrl(tenant.slug).replace(/^https?:\/\//, "")}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      href={tenant.publicUrl}
                      className={cn(
                        appButtonVariants({ variant: "outline", size: "sm" }),
                      )}
                    >
                      Open site
                    </Link>
                    <Link
                      href={tenant.adminUrl}
                      className={cn(
                        appButtonVariants({ variant: "ghost", size: "sm" }),
                      )}
                    >
                      Admin
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
