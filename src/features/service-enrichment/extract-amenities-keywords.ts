import type { AmenityId } from "@/types/salon";

export type ExtractedFeatures = {
  amenities: AmenityId[];
  keywords: string[];
};

const AMENITY_RULES: Array<{ id: AmenityId; patterns: RegExp[] }> = [
  {
    id: "parking",
    patterns: [
      /\bparking\b/i,
      /\bcar park\b/i,
      /\bcarpark\b/i,
      /\bpark on[- ]site\b/i,
      /\bfree parking\b/i,
      /\bcustomer parking\b/i,
    ],
  },
  {
    id: "wifi",
    patterns: [/\bwifi\b/i, /\bwi-fi\b/i, /\bfree wifi\b/i],
  },
  {
    id: "wheelchair",
    patterns: [
      /\bwheelchair\b/i,
      /\baccessible\b/i,
      /\bdisability access\b/i,
      /\bramp access\b/i,
    ],
  },
  {
    id: "coffee",
    patterns: [/\bcoffee\b/i, /\bcomplimentary drink\b/i, /\bcafé\b/i, /\bcafe\b/i],
  },
  {
    id: "air_conditioning",
    patterns: [/\bair[- ]?conditioning\b/i, /\bair[- ]?con\b/i, /\bclimate control\b/i],
  },
];

const KEYWORD_RULES: Array<{ keyword: string; patterns: RegExp[] }> = [
  {
    keyword: "kids",
    patterns: [
      /\bkids?\b/i,
      /\bchildren\b/i,
      /\bfamily friendly\b/i,
      /\bchild[- ]friendly\b/i,
    ],
  },
  {
    keyword: "korean",
    patterns: [/\bkorean\b/i, /한국/, /\bk-beauty\b/i],
  },
  {
    keyword: "japanese",
    patterns: [/\bjapanese\b/i, /日本/, /\bjapan\b/i],
  },
  {
    keyword: "chinese",
    patterns: [/\bchinese\b/i, /中国/, /中文/],
  },
  {
    keyword: "bridal",
    patterns: [/\bbridal\b/i, /\bwedding hair\b/i, /\bwedding\b/i],
  },
  {
    keyword: "organic",
    patterns: [/\borganic\b/i, /\bvegan\b/i, /\bcruelty[- ]free\b/i],
  },
  {
    keyword: "balayage",
    patterns: [/\bbalayage\b/i],
  },
  {
    keyword: "extensions",
    patterns: [/\bextensions?\b/i],
  },
  {
    keyword: "barber",
    patterns: [/\bbarber\b/i, /\bfade\b/i, /\bbeard\b/i],
  },
];

/**
 * Pull amenities + searchable keywords from public listing text / name.
 */
export function extractAmenitiesAndKeywords(
  text: string,
  extras: { name?: string | null; serviceTags?: string[] | null } = {},
): ExtractedFeatures {
  const hay = [text, extras.name ?? "", ...(extras.serviceTags ?? [])]
    .join("\n")
    .trim();
  if (!hay) return { amenities: [], keywords: [] };

  const amenities: AmenityId[] = [];
  for (const rule of AMENITY_RULES) {
    if (rule.patterns.some((re) => re.test(hay))) amenities.push(rule.id);
  }

  const keywords: string[] = [];
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some((re) => re.test(hay))) keywords.push(rule.keyword);
  }

  return {
    amenities: [...new Set(amenities)],
    keywords: [...new Set(keywords)],
  };
}
