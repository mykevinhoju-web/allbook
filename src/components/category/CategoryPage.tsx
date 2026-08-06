"use client";

import { Suspense } from "react";

import { SearchResults } from "@/components/search";
import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import type { MarketplaceCategory } from "@/features/category";
import type { SearchSalonsResult } from "@/features/search";

type CategoryPageProps = {
  category: MarketplaceCategory;
  initialResult?: SearchSalonsResult | null;
};

function CategorySearchFallback() {
  return (
    <div className="flex h-svh flex-col bg-white p-6">
      <LoadingSkeleton count={4} />
    </div>
  );
}

/** Generic category listing — one component for every category route. */
export function CategoryPage({
  category,
  initialResult = null,
}: CategoryPageProps) {
  return (
    <Suspense fallback={<CategorySearchFallback />}>
      <SearchResults category={category} initialResult={initialResult} />
    </Suspense>
  );
}
