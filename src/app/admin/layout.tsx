import type { Metadata, Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminShell, TenantAdminGateway } from "@/features/admin";
import { getTenantSlug } from "@/features/tenants/server";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AllBook Admin",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenantSlug = await getTenantSlug();

  if (!tenantSlug) {
    return <TenantAdminGateway />;
  }

  return (
    <TooltipProvider>
      <AdminShell>{children}</AdminShell>
    </TooltipProvider>
  );
}
