"use client";

import Link from "next/link";

import { useTenant } from "@/features/tenants";

export function SiteHeader() {
  const tenant = useTenant();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
            {tenant.branding.logoInitials}
          </span>
          {tenant.branding.displayName}
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/shops" className="hover:text-foreground">
            Shops
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
