import type { Metadata } from "next";
import { Suspense } from "react";

import { LoadingSkeleton } from "@/components/search/LoadingSkeleton";
import { SearchPage } from "@/components/search";

export const metadata: Metadata = {
  title: "Search salons | AllBook",
  description:
    "Discover and book trusted hair, beauty and wellness salons near you.",
};

function SearchPageFallback() {
  return (
    <div className="min-h-svh bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <LoadingSkeleton count={4} />
      </div>
    </div>
  );
}

export default function SearchRoutePage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPage />
    </Suspense>
  );
}
