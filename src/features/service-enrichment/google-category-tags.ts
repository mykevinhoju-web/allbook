/**
 * Map Google Places types → marketplace service tags (step 1).
 */

const GOOGLE_TYPE_TO_TAG: Record<string, string> = {
  hair_salon: "Hair salon",
  barber_shop: "Barber",
  beauty_salon: "Beauty",
  makeup_artist: "Makeup",
  spa: "Spa",
  nail_salon: "Nails",
  massage: "Massage",
  hair_care: "Hair care",
  beauty_and_spa: "Beauty",
};

export function mapGoogleCategoriesToServiceTags(
  categories: string[] | null | undefined,
  primaryService?: string | null,
): string[] {
  const tags = new Set<string>();
  for (const raw of categories ?? []) {
    const key = raw.trim().toLowerCase();
    const mapped = GOOGLE_TYPE_TO_TAG[key];
    if (mapped) tags.add(mapped);
  }
  const primary = primaryService?.trim();
  if (primary) tags.add(primary);
  return [...tags];
}
