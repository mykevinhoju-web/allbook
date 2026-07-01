import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/common";
import { platformConfig } from "@/config/site";
import { getTenantOptional } from "@/features/tenants/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();

  if (!tenant) {
    return {
      title: {
        default: platformConfig.name,
        template: `%s | ${platformConfig.name}`,
      },
      description: platformConfig.description,
    };
  }

  return {
    title: {
      default: tenant.branding.displayName,
      template: `%s | ${tenant.branding.displayName}`,
    },
    description: tenant.branding.tagline,
  };
}

export default function PublicLayout({
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
