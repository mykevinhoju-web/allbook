import type { Metadata } from "next";

import { SearchPage } from "@/components/search";

export const metadata: Metadata = {
  title: "Search salons | AllBook",
  description:
    "Discover and book trusted hair, beauty and wellness salons near you.",
};

export default function SearchRoutePage() {
  return <SearchPage />;
}
