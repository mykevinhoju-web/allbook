/**
 * Marketplace category engine — single source for routes, search, SEO, breadcrumbs.
 */

export const MARKETPLACE_CATEGORY_SLUGS = [
  "hair",
  "nails",
  "spa",
  "barber",
  "massage",
] as const;

export type MarketplaceCategorySlug =
  (typeof MARKETPLACE_CATEGORY_SLUGS)[number];

export type MarketplaceCategory = {
  slug: MarketplaceCategorySlug;
  /** Human label for UI + breadcrumbs */
  label: string;
  /** Search service filter passed to the search engine */
  service: string;
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
    headline: "Massage therapists near you",
    description: "Relaxation and deep tissue massage from vetted therapists.",
    seoTitle: "Massage",
    seoDescription:
      "Book massage therapists for relaxation and deep tissue treatments on AllBook.",
    heroImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80",
  },
] as const;

/** Map primary_service / search service → category slug */
const SERVICE_TO_CATEGORY: Record<string, MarketplaceCategorySlug> = {
  Hair: "hair",
  Barber: "barber",
  Nails: "nails",
  Spa: "spa",
  Massage: "massage",
  Facial: "spa",
  Waxing: "spa",
  Brows: "spa",
  Lashes: "spa",
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
