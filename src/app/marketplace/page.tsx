import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceSearchPage } from "@/features/marketplace-matching/components/marketplace-search-page";
import { isMarketplaceDemoAllowed } from "@/features/marketplace-matching";

export const metadata: Metadata = {
  title: "Marketplace — What do you need help with?",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  if (!isMarketplaceDemoAllowed()) {
    notFound();
  }

  return <MarketplaceSearchPage />;
}
