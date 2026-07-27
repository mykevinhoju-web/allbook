import type { Metadata, Viewport } from "next";

import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantAdminGateway } from "@/features/admin";
import { PORTAL_THEME_COLOR } from "@/features/portal-theme";
import { RoomLayoutGate } from "@/features/room-portal";
import { getTenantSlug } from "@/features/tenants/server";

export const metadata: Metadata = {
  title: "Room",
  robots: { index: false, follow: false },
  manifest: "/room-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Room",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: PORTAL_THEME_COLOR,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RoomLayout({
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
      <RoomLayoutGate>{children}</RoomLayoutGate>
    </TooltipProvider>
  );
}
