import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  buildSalonPath,
  getMarketplaceCategory,
  isMarketplaceCategorySlug,
} from "@/features/category";
import {
  BookingWizard,
  getMockBookingSalonContext,
} from "@/features/salon-booking";
import { getSalonPageDataBySlug } from "@/features/salon";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: raw, slug } = await params;
  const category = getMarketplaceCategory(raw);
  if (!category) return { title: "Book" };

  return {
    title: `Book · ${slug.replace(/-/g, " ")}`,
    robots: { index: false, follow: false },
  };
}

export default async function MarketplaceSalonBookPage({ params }: PageProps) {
  const { category: raw, slug } = await params;
  if (!isMarketplaceCategorySlug(raw)) notFound();

  const category = getMarketplaceCategory(raw);
  if (!category) notFound();

  const context = getMockBookingSalonContext();
  const supabase = await createClient();
  const live = await getSalonPageDataBySlug(supabase, slug);

  const salonName =
    live.status === "ok" ? live.data.salon.name : context.salonName;

  return (
    <div className="min-h-svh bg-[#F7F4EF]">
      <BookingWizard
        context={{
          ...context,
          salonName,
          slug,
        }}
        backHref={buildSalonPath(category.slug, slug)}
      />
    </div>
  );
}
