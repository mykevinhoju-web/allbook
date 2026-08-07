import type { Metadata } from "next";

import { AdminGoogleSyncPanel } from "@/features/google-sync";
import { PlatformPageHeader } from "@/features/platform";

export const metadata: Metadata = {
  title: "Google Sync",
  robots: { index: false, follow: false },
};

export default function PlatformSyncPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PlatformPageHeader
        title="Google Sync Engine"
        description="Refresh Google snapshot fields for imported businesses. Marketplace search still queries AllBook only — Google is never used at query time."
      />
      <AdminGoogleSyncPanel />
    </div>
  );
}
