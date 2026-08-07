import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/common";
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
  if (!tenant) {
    return children;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
