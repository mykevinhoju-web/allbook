/**
 * Marketplace category engine — single source for routes, search, SEO, breadcrumbs.
 */

export const MARKETPLACE_CATEGORY_SLUGS = [
  "hair",
  "nails",
  "spa",
  "barber",
  "massage",
  "facial",
  "waxing",
] as const;

export type MarketplaceCategorySlug =
  (typeof MARKETPLACE_CATEGORY_SLUGS)[number];

export type MarketplaceCategory = {
  slug: MarketplaceCategorySlug;
  /** Human label for UI + breadcrumbs + HeroSearch */
  label: string;
  /** Search service filter passed to the search engine */
  service: string;
  /** Plural noun used in titles: "Hair Salons in Aspley" */
  resultsNoun: string;
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  heroImage: string;
};

export const MARKETPLACE_CATEGORIES: readonly MarketplaceCategory[] = [
  {
    slug: "hair",
    label: "Hair",
    service: "Hair",
    resultsNoun: "Hair Salons",
    headline: "Hair salons near you",
    description: "Cuts, colour, and styling from verified local salons.",
    seoTitle: "Hair Salons",
    seoDescription:
      "Book hair cuts, colour, and styling at verified salons near you on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "nails",
    label: "Nails",
    service: "Nails",
    resultsNoun: "Nail Salons",
    headline: "Nail studios near you",
    description: "Manicures, pedicures, and nail art from trusted studios.",
    seoTitle: "Nail Salons",
    seoDescription:
      "Find and book nail salons for manicures, pedicures, and nail art on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "spa",
    label: "Spa",
    service: "Spa",
    resultsNoun: "Spas",
    headline: "Spa & wellness near you",
    description: "Relaxing spa rituals and beauty treatments.",
    seoTitle: "Spa & Wellness",
    seoDescription:
      "Discover spa and wellness salons for facials, rituals, and recovery on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "barber",
    label: "Barber",
    service: "Barber",
    resultsNoun: "Barbers",
    headline: "Barbers near you",
    description: "Fades, classic cuts, and beard care from local barbers.",
    seoTitle: "Barbers",
    seoDescription:
      "Book barbers for fades, classic cuts, and beard grooming on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "massage",
    label: "Massage",
    service: "Massage",
    resultsNoun: "Massage Salons",
    headline: "Massage therapists near you",
    description: "Relaxation and deep tissue massage from vetted therapists.",
    seoTitle: "Massage",
    seoDescription:
      "Book massage therapists for relaxation and deep tissue treatments on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "facial",
    label: "Facial",
    service: "Facial",
    resultsNoun: "Facial Salons",
    headline: "Facial treatments near you",
    description: "Glow-enhancing facials from specialist beauty studios.",
    seoTitle: "Facial Treatments",
    seoDescription:
      "Book facial treatments at verified beauty salons near you on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
  },
  {
    slug: "waxing",
    label: "Waxing",
    service: "Waxing",
    resultsNoun: "Waxing Salons",
    headline: "Waxing studios near you",
    description: "Smooth, professional waxing from trusted studios.",
    seoTitle: "Waxing",
    seoDescription:
      "Find and book waxing services at verified salons near you on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1600&q=80",
  },
] as const;

/** Map primary_service / search service → category slug */
const SERVICE_TO_CATEGORY: Record<string, MarketplaceCategorySlug> = {
  Hair: "hair",
  Barber: "barber",
  Nails: "nails",
  Spa: "spa",
  Massage: "massage",
  Facial: "facial",
  Waxing: "waxing",
  Brows: "facial",
  Lashes: "facial",
};

export function isMarketplaceCategorySlug(
  value: string,
): value is MarketplaceCategorySlug {
  return (MARKETPLACE_CATEGORY_SLUGS as readonly string[]).includes(value);
}

export function getMarketplaceCategory(
  slug: string,
): MarketplaceCategory | null {
  if (!isMarketplaceCategorySlug(slug)) return null;
  return (
    MARKETPLACE_CATEGORIES.find((category) => category.slug === slug) ?? null
  );
}

export function resolveCategoryFromService(
  service: string | null | undefined,
): MarketplaceCategory | null {
  const key = service?.trim();
  if (!key) return null;
  const slug = SERVICE_TO_CATEGORY[key];
  return slug ? getMarketplaceCategory(slug) : null;
}

export function resolveCategoryFromLabel(
  label: string | null | undefined,
): MarketplaceCategory | null {
  const key = label?.trim().toLowerCase();
  if (!key) return null;
  return (
    MARKETPLACE_CATEGORIES.find((c) => c.label.toLowerCase() === key) ??
    resolveCategoryFromService(label)
  );
}

/** "Hair Salons in Aspley" */
export function buildCategoryResultsTitle(
  category: MarketplaceCategory,
  location?: string | null,
): string {
  const place = formatLocationDisplay(location);
  if (place) return `${category.resultsNoun} in ${place}`;
  return category.resultsNoun;
}

export function formatLocationDisplay(
  location?: string | null,
): string {
  const raw = location?.trim();
  if (!raw) return "";

  const known = [
    "Aspley",
    "Chermside",
    "Sunnybank",
    "Indooroopilly",
    "Carindale",
    "New Farm",
    "Paddington",
  ].find((suburb) => suburb.toLowerCase() === raw.toLowerCase());

  if (known) return known;

  return raw
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function toLocationQueryParam(location: string): string {
  return location.trim().toLowerCase();
}
