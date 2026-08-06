"use client";

import { Suspense } from "react";

import { SearchResults } from "@/components/search";
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

/** Generic category listing — one component for every category route. */
export function CategoryPage({ category }: CategoryPageProps) {
  return (
    <Suspense fallback={<CategorySearchFallback />}>
      <SearchResults category={category} />
    </Suspense>
  );
}
