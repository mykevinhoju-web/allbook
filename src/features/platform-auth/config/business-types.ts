export const PLATFORM_BUSINESS_TYPES = [
  { value: "day_spa", label: "Day spa / massage" },
  { value: "salon", label: "Hair / beauty salon" },
  { value: "nails", label: "Nails" },
  { value: "clinic", label: "Clinic / wellness" },
  { value: "barber", label: "Barber" },
  { value: "other", label: "Other service" },
] as const;

export type PlatformBusinessType =
  (typeof PLATFORM_BUSINESS_TYPES)[number]["value"];

export function isPlatformBusinessType(
  value: string,
): value is PlatformBusinessType {
  return PLATFORM_BUSINESS_TYPES.some((item) => item.value === value);
}
