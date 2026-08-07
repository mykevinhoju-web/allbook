import type { MarketplaceCategorySlug } from "@/features/category";
import { getMarketplaceCategory } from "@/features/category";

/** Map AllBook categories → Places (New) includedType + text query noun. */
export type PlacesCategoryMapping = {
  categorySlug: MarketplaceCategorySlug;
  primaryService: string;
  includedType: string;
  textNoun: string;
};

const CATEGORY_MAP: Record<string, PlacesCategoryMapping> = {
  hair: {
    categorySlug: "hair",
    primaryService: "Hair",
    includedType: "hair_salon",
    textNoun: "hair salon",
  },
  nails: {
    categorySlug: "nails",
    primaryService: "Nails",
    includedType: "nail_salon",
    textNoun: "nail salon",
  },
  spa: {
    categorySlug: "spa",
    primaryService: "Spa",
    includedType: "spa",
    textNoun: "day spa",
  },
  barber: {
    categorySlug: "barber",
    primaryService: "Barber",
    includedType: "barber_shop",
    textNoun: "barber",
  },
  massage: {
    categorySlug: "massage",
    primaryService: "Massage",
    includedType: "massage",
    textNoun: "massage therapist",
  },
  facial: {
    categorySlug: "facial",
    primaryService: "Facial",
    includedType: "beauty_salon",
    textNoun: "facial spa",
  },
  waxing: {
    categorySlug: "waxing",
    primaryService: "Waxing",
    includedType: "beauty_salon",
    textNoun: "waxing salon",
  },
};

export function resolvePlacesCategoryMapping(
  category: string,
): PlacesCategoryMapping {
  const raw = category.trim().toLowerCase();
  const bySlug = CATEGORY_MAP[raw];
  if (bySlug) return bySlug;

  const fromLabel = getMarketplaceCategory(raw);
  if (fromLabel && CATEGORY_MAP[fromLabel.slug]) {
    return CATEGORY_MAP[fromLabel.slug]!;
  }

  // Label like "Hair Salon"
  for (const mapping of Object.values(CATEGORY_MAP)) {
    if (
      raw.includes(mapping.categorySlug) ||
      raw.includes(mapping.primaryService.toLowerCase())
    ) {
      return mapping;
    }
  }

  throw new Error(
    `Unsupported import category "${category}". Use one of: ${Object.keys(CATEGORY_MAP).join(", ")}`,
  );
}

export function buildTextQuery(input: {
  textNoun: string;
  city: string;
  state: string;
  country: string;
}): string {
  return `${input.textNoun} in ${input.city}, ${input.state}, ${input.country}`;
}
