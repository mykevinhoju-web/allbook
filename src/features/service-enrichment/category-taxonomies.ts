import type { HairServiceTemplate } from "./hair-service-taxonomy";
import { HAIR_SERVICE_TAXONOMY } from "./hair-service-taxonomy";

export type ServiceTemplate = HairServiceTemplate;

export const NAILS_SERVICE_TAXONOMY: readonly ServiceTemplate[] = [
  {
    category: "Manicure",
    name: "Classic Manicure",
    keywords: ["manicure", "mani"],
    durationMinutes: 45,
    priceFrom: 35,
  },
  {
    category: "Manicure",
    name: "Gel Manicure",
    keywords: ["gel manicure", "gel nails", "shellac", "gelish"],
    durationMinutes: 60,
    priceFrom: 50,
  },
  {
    category: "Pedicure",
    name: "Classic Pedicure",
    keywords: ["pedicure", "pedi"],
    durationMinutes: 45,
    priceFrom: 45,
  },
  {
    category: "Pedicure",
    name: "Gel Pedicure",
    keywords: ["gel pedicure", "gel pedi"],
    durationMinutes: 60,
    priceFrom: 60,
  },
  {
    category: "Extensions",
    name: "Acrylic Nails",
    keywords: ["acrylic", "acrylics", "full set"],
    durationMinutes: 90,
    priceFrom: 70,
  },
  {
    category: "Extensions",
    name: "Nail Extensions",
    keywords: ["nail extensions", "extensions", "sculptured"],
    durationMinutes: 90,
    priceFrom: 75,
  },
  {
    category: "Art",
    name: "Nail Art",
    keywords: ["nail art", "chrome nails", "french tip"],
    durationMinutes: 30,
    priceFrom: 15,
  },
  {
    category: "Care",
    name: "Nail Removal",
    keywords: ["removal", "soak off", "gel removal"],
    durationMinutes: 30,
    priceFrom: 20,
  },
] as const;

export const SPA_SERVICE_TAXONOMY: readonly ServiceTemplate[] = [
  {
    category: "Massage",
    name: "Relaxation Massage",
    keywords: ["relaxation massage", "swedish", "massage"],
    durationMinutes: 60,
    priceFrom: 90,
  },
  {
    category: "Massage",
    name: "Deep Tissue Massage",
    keywords: ["deep tissue", "remedial", "sports massage"],
    durationMinutes: 60,
    priceFrom: 110,
  },
  {
    category: "Facial",
    name: "Classic Facial",
    keywords: ["facial", "signature facial", "express facial"],
    durationMinutes: 60,
    priceFrom: 90,
  },
  {
    category: "Body",
    name: "Body Scrub",
    keywords: ["body scrub", "exfoliation", "polish"],
    durationMinutes: 45,
    priceFrom: 80,
  },
  {
    category: "Body",
    name: "Body Wrap",
    keywords: ["body wrap", "wrap treatment"],
    durationMinutes: 60,
    priceFrom: 100,
  },
  {
    category: "Packages",
    name: "Spa Package",
    keywords: ["spa package", "day spa", "pamper package"],
    durationMinutes: 120,
    priceFrom: 180,
  },
] as const;

export const BARBER_SERVICE_TAXONOMY: readonly ServiceTemplate[] = [
  {
    category: "Cut",
    name: "Men's Cut",
    keywords: ["men's cut", "mens cut", "haircut", "fade", "taper"],
    durationMinutes: 30,
    priceFrom: 35,
  },
  {
    category: "Cut",
    name: "Skin Fade",
    keywords: ["skin fade", "bald fade", "zero fade"],
    durationMinutes: 35,
    priceFrom: 40,
  },
  {
    category: "Barber",
    name: "Beard Trim",
    keywords: ["beard trim", "beard shape", "line up"],
    durationMinutes: 20,
    priceFrom: 20,
  },
  {
    category: "Barber",
    name: "Hot Towel Shave",
    keywords: ["hot towel", "traditional shave", "wet shave"],
    durationMinutes: 30,
    priceFrom: 35,
  },
  {
    category: "Cut",
    name: "Cut & Beard",
    keywords: ["cut and beard", "hair and beard", "combo"],
    durationMinutes: 45,
    priceFrom: 50,
  },
  {
    category: "Kids",
    name: "Kids Cut",
    keywords: ["kids cut", "children", "junior"],
    durationMinutes: 25,
    priceFrom: 25,
  },
] as const;

export function taxonomyForPrimaryService(
  primaryService: string | null | undefined,
): readonly ServiceTemplate[] {
  const key = (primaryService ?? "").trim().toLowerCase();
  if (key.includes("nail")) return NAILS_SERVICE_TAXONOMY;
  if (key.includes("spa") || key.includes("massage") || key.includes("facial")) {
    return SPA_SERVICE_TAXONOMY;
  }
  if (key.includes("barber")) return BARBER_SERVICE_TAXONOMY;
  if (key.includes("hair")) return HAIR_SERVICE_TAXONOMY;
  return [
    ...HAIR_SERVICE_TAXONOMY,
    ...BARBER_SERVICE_TAXONOMY,
    ...NAILS_SERVICE_TAXONOMY,
    ...SPA_SERVICE_TAXONOMY,
  ];
}

export const ENRICHABLE_PRIMARY_SERVICES = [
  "Hair",
  "Barber",
  "Nails",
  "Spa",
  "Massage",
  "Facial",
  "Waxing",
] as const;
