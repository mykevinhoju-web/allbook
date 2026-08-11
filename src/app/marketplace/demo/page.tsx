import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplaceDemoPanel } from "@/features/marketplace-matching/components/marketplace-demo-panel";
import { isMarketplaceDemoAllowed } from "@/features/marketplace-matching";

export const metadata: Metadata = {
  title: "Marketplace matching demo",
  robots: { index: false, follow: false },
};

export default function MarketplaceDemoPage() {
  if (!isMarketplaceDemoAllowed()) {
    notFound();
  }

  return <MarketplaceDemoPanel />;
}
