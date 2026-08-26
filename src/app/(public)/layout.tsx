import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/common";
import { isEverTenant } from "@/features/ever";
import { getIsPlatformAdmin } from "@/features/private-preview/access";
import { isPrivatePreviewEnabled } from "@/features/private-preview";
import { getTenantOptional } from "@/features/tenants/server";

export const metadata: Metadata = {
  robots: isPrivatePreviewEnabled()
    ? { index: false, follow: false }
    : undefined,
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantOptional();

  // Platform apex uses a full-bleed marketing landing (no site chrome).
  // Ever is full-bleed while under construction (no shared site chrome).
  if (!tenant || isEverTenant(tenant.slug)) {
    return children;
  }

  const showDocumentation = await getIsPlatformAdmin();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter
        displayName={tenant.branding.displayName}
        tagline={tenant.branding.tagline}
        showDocumentation={showDocumentation}
      />
    </>
  );
}
