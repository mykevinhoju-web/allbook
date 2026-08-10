/**
 * Hair / barber service taxonomy for draft menu extraction (step 2).
 */

export type HairServiceTemplate = {
  category: string;
  name: string;
  /** Case-insensitive phrases that imply this service */
  keywords: string[];
  durationMinutes: number;
  /** Suggested starting price (AUD) — draft only */
  priceFrom: number;
};

export const HAIR_SERVICE_TAXONOMY: readonly HairServiceTemplate[] = [
  {
    category: "Cut",
    name: "Women's Cut",
    keywords: ["women's cut", "ladies cut", "female cut", "womens cut", "cut and style"],
    durationMinutes: 45,
    priceFrom: 55,
  },
  {
    category: "Cut",
    name: "Men's Cut",
    keywords: ["men's cut", "mens cut", "gents cut", "male cut", "men cut"],
    durationMinutes: 30,
    priceFrom: 35,
  },
  {
    category: "Cut",
    name: "Kids Cut",
    keywords: ["kids cut", "children's cut", "child cut", "junior cut"],
    durationMinutes: 30,
    priceFrom: 25,
  },
  {
    category: "Styling",
    name: "Blow Dry",
    keywords: ["blow dry", "blowdry", "blow-dry", "finish"],
    durationMinutes: 30,
    priceFrom: 40,
  },
  {
    category: "Colour",
    name: "Full Colour",
    keywords: ["full colour", "global colour", "all over colour", "permanent colour", "color"],
    durationMinutes: 90,
    priceFrom: 120,
  },
  {
    category: "Colour",
    name: "Highlights",
    keywords: ["highlights", "foils", "foil"],
    durationMinutes: 120,
    priceFrom: 150,
  },
  {
    category: "Colour",
    name: "Balayage",
    keywords: ["balayage", "freehand"],
    durationMinutes: 150,
    priceFrom: 180,
  },
  {
    category: "Colour",
    name: "Bleach / Lightening",
    keywords: ["bleach", "lightening", "platinum", "blonding"],
    durationMinutes: 120,
    priceFrom: 160,
  },
  {
    category: "Colour",
    name: "Toner / Gloss",
    keywords: ["toner", "gloss", "glossing", "toning"],
    durationMinutes: 30,
    priceFrom: 40,
  },
  {
    category: "Texture",
    name: "Perm",
    keywords: ["perm", "permanent wave", "digital perm"],
    durationMinutes: 120,
    priceFrom: 140,
  },
  {
    category: "Texture",
    name: "Keratin / Smoothing",
    keywords: ["keratin", "smoothing", "brazilian blowout", "straightening treatment"],
    durationMinutes: 150,
    priceFrom: 200,
  },
  {
    category: "Extensions",
    name: "Hair Extensions",
    keywords: ["extensions", "tape-in", "keratin bond", "weft"],
    durationMinutes: 120,
    priceFrom: 250,
  },
  {
    category: "Events",
    name: "Bridal / Formal Hair",
    keywords: ["bridal", "wedding hair", "formal hair", "upstyle", "updo"],
    durationMinutes: 60,
    priceFrom: 90,
  },
  {
    category: "Barber",
    name: "Beard Trim",
    keywords: ["beard trim", "beard sculpt", "beard shape"],
    durationMinutes: 20,
    priceFrom: 20,
  },
  {
    category: "Barber",
    name: "Hot Towel Shave",
    keywords: ["hot towel", "traditional shave", "cut throat", "wet shave"],
    durationMinutes: 30,
    priceFrom: 35,
  },
  {
    category: "Treatment",
    name: "Hair Treatment",
    keywords: ["treatment", "olaplex", "bond builder", "scalp treatment", " conditioning treatment"],
    durationMinutes: 30,
    priceFrom: 35,
  },
] as const;
