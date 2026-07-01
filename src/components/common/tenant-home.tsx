import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { Tenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

interface TenantHomePageProps {
  tenant: Tenant;
}

export function TenantHomePage({ tenant }: TenantHomePageProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-20">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Wellness &amp; beauty booking
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Book your next visit with {tenant.branding.displayName}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {tenant.branding.tagline}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/shops" className={cn(buttonVariants())}>
            Browse shops
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {[
          {
            title: "Massage",
            description: "Therapeutic and relaxation treatments.",
          },
          {
            title: "Beauty",
            description: "Hair, skin, and personal care services.",
          },
          {
            title: "Spa & Nail",
            description: "Spa rituals and nail care appointments.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-xl border bg-card p-6 text-card-foreground shadow-soft"
          >
            <h2 className="text-lg font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
