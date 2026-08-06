"use client";

import { Suspense } from "react";

import { SearchPage } from "@/components/search";
import type { MarketplaceCategory } from "@/features/category";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";

type CategoryPageProps = {
  category: MarketplaceCategory;
};

function CategorySearchFallback() {
  return (
    <div className="flex h-svh flex-col bg-white p-6">
      <LoadingSkeleton count={4} />
    </div>
  );
}

/** Generic category listing engine — one component for all category routes. */
export function CategoryPage({ category }: CategoryPageProps) {
  return (
    <Suspense fallback={<CategorySearchFallback />}>
      <SearchPage category={category} />
    </Suspense>
  );
}
