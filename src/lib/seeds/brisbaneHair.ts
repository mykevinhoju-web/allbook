import type { OpeningHours } from "@/types/salon";

import type { SalonImportRecord } from "@/features/salon/import-types";

type SuburbSeed = {
  name: string;
  postcode: string;
  lat: number;
  lng: number;
};

const SUBURBS: SuburbSeed[] = [
  { name: "Aspley", postcode: "4034", lat: -27.3632, lng: 153.0164 },
  { name: "Chermside", postcode: "4032", lat: -27.3849, lng: 153.0312 },
  { name: "Sunnybank", postcode: "4109", lat: -27.5704, lng: 153.0608 },
  { name: "Indooroopilly", postcode: "4068", lat: -27.4992, lng: 152.9726 },
  { name: "Carindale", postcode: "4152", lat: -27.503, lng: 153.102 },
  { name: "Paddington", postcode: "4064", lat: -27.459, lng: 152.999 },
  { name: "New Farm", postcode: "4005", lat: -27.4676, lng: 153.0489 },
  { name: "Fortitude Valley", postcode: "4006", lat: -27.457, lng: 153.035 },
  { name: "North Lakes", postcode: "4509", lat: -27.24, lng: 153.016 },
  { name: "Albany Creek", postcode: "4035", lat: -27.348, lng: 152.968 },
  { name: "Kedron", postcode: "4031", lat: -27.405, lng: 153.028 },
  { name: "Nundah", postcode: "4012", lat: -27.402, lng: 153.058 },
  { name: "Toowong", postcode: "4066", lat: -27.485, lng: 152.992 },
  { name: "West End", postcode: "4101", lat: -27.481, lng: 153.013 },
  { name: "South Brisbane", postcode: "4101", lat: -27.475, lng: 153.017 },
  { name: "Wynnum", postcode: "4178", lat: -27.443, lng: 153.176 },
  { name: "Capalaba", postcode: "4157", lat: -27.523, lng: 153.192 },
  { name: "Mount Gravatt", postcode: "4122", lat: -27.538, lng: 153.078 },
  { name: "Garden City", postcode: "4122", lat: -27.562, lng: 153.082 },
  { name: "Mitchelton", postcode: "4053", lat: -27.416, lng: 152.976 },
];

const NAME_PREFIXES = [
  "Glow",
  "Luxe",
  "Studio",
  "Atelier",
  "Maison",
  "Bloom",
  "Aura",
  "Velvet",
  "Noir",
  "Ivory",
  "Golden",
  "Silk",
  "Urban",
  "Coastal",
  "River",
  "Crown",
  "Palette",
  "Frame",
  "Mirror",
  "Haus",
];

const NAME_SUFFIXES = [
  "Hair",
  "Hair Studio",
  "Hair Co",
  "Colour Bar",
  "Salon",
  "Cut & Colour",
  "Blow Dry Bar",
  "Hair Lounge",
  "Beauty & Hair",
  "Hair Collective",
];

const STREETS = [
  "Gympie Rd",
  "Hamilton Rd",
  "Mains Rd",
  "Brunswick St",
  "Ann St",
  "Wickham St",
  "Given Tce",
  "Latrobe Tce",
  "High St",
  "Oxford St",
  "Logan Rd",
  "Creek Rd",
  "Beaudesert Rd",
  "South Pine Rd",
  "Webster Rd",
  "Sandgate Rd",
  "Kedron Brook Rd",
  "Racecourse Rd",
  "Stanley St",
  "Vulture St",
];

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595476108010-b4d1e1023910?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaaae1b0?auto=format&fit=crop&w=1200&q=80",
];

const STAFF_PHOTOS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
];

const FIRST_NAMES = [
  "Mia",
  "Jordan",
  "Sofia",
  "Alex",
  "Harper",
  "Riley",
  "Olivia",
  "Noah",
  "Ava",
  "Ethan",
  "Chloe",
  "Lucas",
];

const LAST_NAMES = [
  "Chen",
  "Lee",
  "Park",
  "Nguyen",
  "Brooks",
  "Walsh",
  "Singh",
  "Taylor",
  "Kim",
  "Morgan",
];

function defaultHours(): OpeningHours {
  return {
    mon: { open: "09:00", close: "18:00", closed: false },
    tue: { open: "09:00", close: "18:00", closed: false },
    wed: { open: "09:00", close: "18:00", closed: false },
    thu: { open: "09:00", close: "20:00", closed: false },
    fri: { open: "09:00", close: "18:00", closed: false },
    sat: { open: "09:00", close: "17:00", closed: false },
    sun: { open: "10:00", close: "16:00", closed: true },
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function jitter(seed: number, amount: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * amount;
}

function phoneFor(index: number): string {
  const base = 30001000 + index;
  const as = String(base).padStart(8, "0");
  return `+61 7 ${as.slice(0, 4)} ${as.slice(4)}`;
}

function roundCoord(value: number): number {
  return Math.round(value * 100000) / 100000;
}

/**
 * Generate 100+ realistic Brisbane hair salon import records.
 * Deterministic — safe to re-run imports.
 */
export function generateBrisbaneHairSalons(
  count = 110,
): SalonImportRecord[] {
  const records: SalonImportRecord[] = [];
  const usedSlugs = new Set<string>();

  for (let i = 0; i < count; i += 1) {
    const suburb = SUBURBS[i % SUBURBS.length]!;
    const prefix = NAME_PREFIXES[i % NAME_PREFIXES.length]!;
    const suffix = NAME_SUFFIXES[Math.floor(i / NAME_PREFIXES.length) % NAME_SUFFIXES.length]!;
    let name = `${prefix} ${suffix}`;
    if (i >= NAME_PREFIXES.length * NAME_SUFFIXES.length) {
      name = `${prefix} ${suffix} ${suburb.name}`;
    }

    let slug = slugify(`${name}-${suburb.name}`);
    let n = 2;
    while (usedSlugs.has(slug)) {
      slug = slugify(`${name}-${suburb.name}-${n}`);
      n += 1;
    }
    usedSlugs.add(slug);

    const streetNo = 10 + ((i * 7) % 240);
    const street = STREETS[i % STREETS.length]!;
    const lat = roundCoord(suburb.lat + jitter(i + 1, 0.012));
    const lng = roundCoord(suburb.lng + jitter(i + 17, 0.012));
    const priceMin = 45 + (i % 6) * 5;
    const priceMax = priceMin + 90 + (i % 5) * 20;
    const rating = Math.round((4.2 + (i % 8) * 0.1) * 10) / 10;
    const reviewCount = 24 + ((i * 13) % 420);

    const staffCount = 2 + (i % 3);
    const staff = Array.from({ length: staffCount }, (_, staffIndex) => {
      const first = FIRST_NAMES[(i + staffIndex) % FIRST_NAMES.length]!;
      const last = LAST_NAMES[(i * 3 + staffIndex) % LAST_NAMES.length]!;
      return {
        name: `${first} ${last}`,
        position:
          staffIndex === 0
            ? "Senior Stylist"
            : staffIndex === 1
              ? "Colourist"
              : "Stylist",
        photoUrl: STAFF_PHOTOS[(i + staffIndex) % STAFF_PHOTOS.length]!,
        yearsExperience: 3 + ((i + staffIndex) % 12),
        languages: staffIndex % 2 === 0 ? ["English"] : ["English", "Mandarin"],
        specialties:
          staffIndex === 0
            ? ["Balayage", "Cuts"]
            : staffIndex === 1
              ? ["Colour", "Toner"]
              : ["Blow Dry", "Styling"],
        sortOrder: staffIndex,
      };
    });

    records.push({
      name,
      slug,
      categorySlug: "hair",
      suburbName: suburb.name,
      description: `${name} is a neighbourhood hair salon in ${suburb.name}, Brisbane — known for precision cuts, colour, and friendly appointments.`,
      phone: phoneFor(i),
      email: `hello@${slug.replace(/-/g, "")}.example`,
      website: `https://example.com/${slug}`,
      address: `${streetNo} ${street}`,
      latitude: lat,
      longitude: lng,
      coverImage: COVER_IMAGES[i % COVER_IMAGES.length]!,
      logo: COVER_IMAGES[(i + 2) % COVER_IMAGES.length]!,
      rating: Math.min(5, rating),
      reviewCount,
      verified: i % 4 !== 0,
      primaryService: "Hair",
      startingPrice: priceMin,
      priceMin,
      priceMax,
      amenities:
        i % 3 === 0
          ? ["wifi", "parking", "air_conditioning", "coffee"]
          : ["wifi", "parking", "air_conditioning"],
      serviceTags: ["Hair", "Colour", "Treatment"],
      openingHours: defaultHours(),
      gallery: [
        {
          url: COVER_IMAGES[i % COVER_IMAGES.length]!,
          alt: `${name} interior`,
          sortOrder: 0,
        },
        {
          url: COVER_IMAGES[(i + 1) % COVER_IMAGES.length]!,
          alt: `${name} styling`,
          sortOrder: 1,
        },
        {
          url: COVER_IMAGES[(i + 2) % COVER_IMAGES.length]!,
          alt: `${name} colour bar`,
          sortOrder: 2,
        },
      ],
      services: [
        {
          category: "Hair",
          name: "Women's Cut & Style",
          description: "Consultation, cut and blow dry.",
          durationMinutes: 60,
          price: priceMin + 20,
          sortOrder: 0,
        },
        {
          category: "Hair",
          name: "Men's Cut",
          description: "Precision cut and finish.",
          durationMinutes: 30,
          price: priceMin,
          sortOrder: 1,
        },
        {
          category: "Colour",
          name: "Full Colour",
          description: "Root-to-tip colour application.",
          durationMinutes: 90,
          price: priceMin + 80,
          sortOrder: 0,
        },
        {
          category: "Colour",
          name: "Balayage",
          description: "Hand-painted soft highlight.",
          durationMinutes: 150,
          price: priceMax - 20,
          sortOrder: 1,
        },
        {
          category: "Treatment",
          name: "Deep Condition",
          description: "Intensive moisture mask.",
          durationMinutes: 30,
          price: 45,
          sortOrder: 0,
        },
      ],
      staff,
    });
  }

  return records;
}

/** Pre-built seed payload used by the import script. */
export const brisbaneHairSalons = generateBrisbaneHairSalons(110);
