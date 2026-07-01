import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/common";
import { getTenant } from "@/features/tenants/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();

  return {
    title: {
      default: tenant.branding.displayName,
      template: `%s | ${tenant.branding.displayName}`,
    },
    description: tenant.branding.tagline,
  };
}

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
