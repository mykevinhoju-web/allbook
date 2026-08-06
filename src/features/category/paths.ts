import type { Metadata } from "next";

import type { SearchQuery } from "@/lib/search";
import { buildSearchPath, normalizeSearchQuery } from "@/lib/search";

import {
  buildCategoryResultsTitle,
  formatLocationDisplay,
  getMarketplaceCategory,
  resolveCategoryFromService,
  type MarketplaceCategory,
  type MarketplaceCategorySlug,
} from "./constants";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** Alias — category listing URLs are owned by the shared search path builder. */
export function buildMarketplaceSearchPath(
  query: Partial<SearchQuery> = {},
): string {
  return buildSearchPath(query) ?? "/";
}

export function buildCategoryPath(
  categorySlug: MarketplaceCategorySlug,
  query: Partial<SearchQuery> = {},
): string {
  const category = getMarketplaceCategory(categorySlug);
  if (!category) return "/";

  return (
    buildSearchPath({
      ...normalizeSearchQuery(query),
      service: category.service,
    }) ?? `/${category.slug}`
  );
}

export function buildSalonPath(
  categorySlug: MarketplaceCategorySlug,
  salonSlug: string,
): string {
  return `/${categorySlug}/${encodeURIComponent(salonSlug)}`;
}

export function buildSalonPathFromService(
  primaryService: string | null | undefined,
  salonSlug: string,
  fallbackCategory: MarketplaceCategorySlug = "hair",
): string {
  const category =
    resolveCategoryFromService(primaryService) ??
    getMarketplaceCategory(fallbackCategory);
  return buildSalonPath(category!.slug, salonSlug);
}

export function buildCategoryBreadcrumbs(
  category: MarketplaceCategory,
  options: { location?: string | null; salonName?: string } = {},
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    {
      label: options.location
        ? buildCategoryResultsTitle(category, options.location)
        : category.label,
      href: options.salonName
        ? buildCategoryPath(category.slug, {
            location: options.location ?? "",
            service: category.service,
          })
        : undefined,
    },
  ];

  if (options.salonName) {
    items.push({ label: options.salonName });
  }

  return items;
}

export function buildCategoryMetadata(
  category: MarketplaceCategory,
  location?: string | null,
): Metadata {
  const title = buildCategoryResultsTitle(category, location);
  const place = formatLocationDisplay(location);
  const description = place
    ? `Book ${category.resultsNoun.toLowerCase()} in ${place} on AllBook.`
    : category.seoDescription;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | AllBook`,
      description,
      images: [{ url: category.heroImage }],
    },
  };
}

export function buildSalonMetadata(input: {
  category: MarketplaceCategory;
  salonName: string;
  description: string | null;
  suburb: string;
}): Metadata {
  const description =
    input.description?.trim() ||
    `Book ${input.salonName} in ${input.suburb} for ${input.category.label.toLowerCase()} on AllBook.`;

  return {
    title: `${input.salonName} · ${input.category.label}`,
    description,
    openGraph: {
      title: `${input.salonName} | AllBook`,
      description,
    },
  };
}
