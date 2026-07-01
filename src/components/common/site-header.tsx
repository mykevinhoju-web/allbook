import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {siteConfig.name}
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
