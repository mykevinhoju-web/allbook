import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryPage } from "@/components/category";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import {
  buildCategoryMetadata,
  getMarketplaceCategory,
  isMarketplaceCategorySlug,
} from "@/features/category";

type PageProps = {
  params: Promise<{ category: string }>;
};

export async function generateStaticParams() {
  return [
    { category: "hair" },
    { category: "nails" },
    { category: "spa" },
    { category: "barber" },
    { category: "massage" },
  ];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category: raw } = await params;
  const category = getMarketplaceCategory(raw);
  if (!category) {
    return { title: "Category" };
  }
  return buildCategoryMetadata(category);
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
