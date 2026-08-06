import type { ServiceCategory } from "./types";

/** Canonical duration options (minutes) for service forms + booking slots. */
export const SERVICE_DURATION_OPTIONS = [
  15, 30, 45, 60, 75, 90, 120, 150, 180, 240,
] as const;

export type ServiceDurationOption = (typeof SERVICE_DURATION_OPTIONS)[number];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Hair Cut",
  "Hair Colour",
  "Treatment",
  "Perm",
  "Styling",
  "Extensions",
  "Kids",
  "Consultation",
];

export const SERVICE_PRICE_TYPE_LABELS = {
  fixed: "Fixed price",
  from: "From price",
  range: "Price range",
} as const;

/** Slot helper — booking engine can import this without UI deps. */
export function isValidServiceDuration(minutes: number): boolean {
  return (SERVICE_DURATION_OPTIONS as readonly number[]).includes(minutes);
}

export function formatDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return hours === 1 ? "1 hr" : `${hours} hrs`;
  return `${hours}h ${rem}m`;
}

export function formatServicePrice(options: {
  price: number;
  priceMax: number | null;
  priceType: "fixed" | "from" | "range";
}): string {
  const money = (n: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(n);

  if (options.priceType === "from") return `From ${money(options.price)}`;
  if (options.priceType === "range" && options.priceMax != null) {
    return `${money(options.price)} – ${money(options.priceMax)}`;
  }
  return money(options.price);
}
