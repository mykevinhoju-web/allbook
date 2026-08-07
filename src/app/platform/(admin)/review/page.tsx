import type { Metadata } from "next";

import { AdminReviewQueuePanel } from "@/features/marketplace-review";
import { PlatformPageHeader } from "@/features/platform";

export const metadata: Metadata = {
  title: "Business Review",
  robots: { index: false, follow: false },
};

export default function PlatformReviewPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PlatformPageHeader
        title="Marketplace Business Review"
        description="Review imported and synced businesses before they are fully trusted. Marketplace search still queries AllBook only."
      />
      <AdminReviewQueuePanel />
    </div>
  );
}
