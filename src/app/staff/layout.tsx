import type { Metadata, Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantAdminGateway } from "@/features/admin";
import { StaffLayoutGate } from "@/features/staff-portal";
import { getTenantSlug } from "@/features/tenants/server";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AllBook Staff",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default async function StaffLayout({
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
      <StaffLayoutGate>{children}</StaffLayoutGate>
    </TooltipProvider>
  );
}
