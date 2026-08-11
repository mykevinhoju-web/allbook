import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketplacePartnerDetail } from "@/features/marketplace-matching/components/marketplace-partner-detail";
import { isMarketplaceDemoAllowed } from "@/features/marketplace-matching";

export const metadata: Metadata = {
  title: "Partner details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function MarketplacePartnerPage({ params }: Props) {
  if (!isMarketplaceDemoAllowed()) {
    notFound();
  }
  const { id } = await params;
  return <MarketplacePartnerDetail partnerId={id} />;
}
