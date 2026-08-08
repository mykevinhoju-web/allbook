import type { Metadata } from "next";

import { AdminBusinessesPanel } from "@/features/marketplace-admin";
import { PlatformPageHeader } from "@/features/platform";

export const metadata: Metadata = {
  title: "Businesses",
  robots: { index: false, follow: false },
};

export default function PlatformBusinessesPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PlatformPageHeader
        title="Marketplace Businesses"
        description="Browse every business stored in AllBook. Enable online booking and marketplace visibility from here."
      />
      <AdminBusinessesPanel />
    </div>
  );
}
