import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryPage } from "@/components/category";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import {
  buildCategoryMetadata,
  getMarketplaceCategory,
  isMarketplaceCategorySlug,
  MARKETPLACE_CATEGORY_SLUGS,
} from "@/features/category";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateStaticParams() {
  return MARKETPLACE_CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category: raw } = await params;
  const category = getMarketplaceCategory(raw);
  if (!category) {
    return { title: "Category" };
  }

  const sp = await searchParams;
  const locationRaw = sp.location;
  const location = Array.isArray(locationRaw)
    ? locationRaw[0]
    : locationRaw;

  return buildCategoryMetadata(category, location);
}

function CategoryFallback() {
  return (
    <div className="flex h-svh flex-col bg-white p-6">
      <LoadingSkeleton count={4} />
    </div>
  );
}

export default async function MarketplaceCategoryPage({ params }: PageProps) {
  const { category: raw } = await params;
  if (!isMarketplaceCategorySlug(raw)) {
    notFound();
  }

  const category = getMarketplaceCategory(raw);
  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryPage category={category} />
    </Suspense>
  );
}
