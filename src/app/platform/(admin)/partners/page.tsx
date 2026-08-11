import type { Metadata } from "next";

import { AdminPartnersPanel } from "@/features/marketplace-partner/components/admin-partners-panel";
import { PlatformPageHeader } from "@/features/platform";

export const metadata: Metadata = {
  title: "Partners",
  robots: { index: false, follow: false },
};

export default function PlatformPartnersPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PlatformPageHeader
        title="Marketplace Partners"
        description="Review Partner applications, activate or suspend accounts, and inspect partner-entered services."
      />
      <AdminPartnersPanel />
    </div>
  );
}
