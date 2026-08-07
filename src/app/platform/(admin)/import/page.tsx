import type { Metadata } from "next";

import { AdminGoogleImportPanel } from "@/features/google-import/admin-import-panel";
import { PlatformPageHeader } from "@/features/platform";

export const metadata: Metadata = {
  title: "Google Import",
  robots: { index: false, follow: false },
};

export default function PlatformImportPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PlatformPageHeader
        title="Google Business Import"
        description="Discover real businesses from Google Places and upsert them into the Marketplace catalog by place_id. Search still queries AllBook only."
      />
      <AdminGoogleImportPanel />
    </div>
  );
}
