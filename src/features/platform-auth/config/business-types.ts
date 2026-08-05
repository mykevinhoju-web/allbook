/**
 * Broad service categories for free-trial signup.
 * Keep umbrella labels — do not list every trade (plumber, painter, lawn care, etc.).
 */
export const PLATFORM_BUSINESS_TYPES = [
  { value: "beauty_wellness", label: "Beauty & wellness" },
  { value: "health_care", label: "Health & care" },
  { value: "home_trade", label: "Home & trade services" },
  { value: "auto_mobile", label: "Auto & mobile services" },
  { value: "pets_animals", label: "Pets & animals" },
  { value: "education_coaching", label: "Education & coaching" },
  { value: "events_creative", label: "Events & creative" },
  { value: "professional", label: "Professional services" },
  { value: "other", label: "Other service business" },
] as const;

export type PlatformBusinessType =
  (typeof PLATFORM_BUSINESS_TYPES)[number]["value"];

export function isPlatformBusinessType(
  value: string,
): value is PlatformBusinessType {
  return PLATFORM_BUSINESS_TYPES.some((item) => item.value === value);
}
