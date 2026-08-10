import type { Metadata } from "next";

import { PlatformMarketplaceSettingsPanel } from "@/features/platform/components/platform-marketplace-settings-panel";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default function PlatformSettingsPage() {
  return <PlatformMarketplaceSettingsPanel />;
}
