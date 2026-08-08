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
import { searchSalons } from "@/features/search";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

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
  const location = first(sp.location) ?? first(sp.suburb);

  return buildCategoryMetadata(category, location);
}

function CategoryFallback() {
  return (
    <div className="flex h-svh flex-col bg-white p-6">
      <LoadingSkeleton count={4} />
    </div>
  );
}

export default async function MarketplaceCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { category: raw } = await params;
  if (!isMarketplaceCategorySlug(raw)) {
    notFound();
  }

  const category = getMarketplaceCategory(raw);
  if (!category) {
    notFound();
  }

  const sp = await searchParams;
  const supabase = await createClient();
  const initialResult = await searchSalons(supabase, {
    location: first(sp.location),
    latitude: first(sp.lat),
    longitude: first(sp.lng),
    service: category.service,
    suburb: first(sp.suburb),
    radiusKm: first(sp.radius),
    sort: first(sp.sort),
    minRating: first(sp.rating),
    verifiedOnly: first(sp.verified),
    openNow: first(sp.open),
    page: first(sp.page),
  });

  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryPage category={category} initialResult={initialResult} />
    </Suspense>
  );
}
