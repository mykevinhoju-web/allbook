import type { DayOfWeek, OpeningHours, OpeningHoursDay } from "@/types/salon";

export type BusinessSocialLinks = {
  instagram: string;
  facebook: string;
  tiktok: string;
};

export type BusinessSettings = {
  bookingEnabled: boolean;
  acceptNewCustomers: boolean;
  /** Read-only from salons.verified */
  verified: boolean;
  /**
   * Featured is not a salons column yet — UI placeholder only (admin).
   * Do not persist until a dedicated column exists.
   */
  featured: boolean;
};

export type BusinessProfile = {
  id: string;
  slug: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
  coverImage: string | null;
  address: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  openingHours: OpeningHours;
  social: BusinessSocialLinks;
  settings: BusinessSettings;
  categorySlug: string;
  publicPath: string;
  updatedAt: string;
};

export type BusinessProfileInput = {
  name: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
  coverImage: string | null;
  address: string;
  suburb: string;
  latitude: number;
  longitude: number;
  openingHours: OpeningHours;
  social: BusinessSocialLinks;
  settings: Pick<BusinessSettings, "bookingEnabled" | "acceptNewCustomers">;
};

export const BUSINESS_DAY_ORDER: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const BUSINESS_DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function defaultOpeningHours(): OpeningHours {
  const open = (openTime: string, closeTime: string): OpeningHoursDay => ({
    open: openTime,
    close: closeTime,
    closed: false,
  });
  return {
    mon: open("09:00", "18:00"),
    tue: open("09:00", "18:00"),
    wed: open("09:00", "18:00"),
    thu: open("09:00", "20:00"),
    fri: open("09:00", "18:00"),
    sat: open("09:00", "17:00"),
    sun: { open: "10:00", close: "16:00", closed: true },
  };
}

/** Demo owner salon for /platform/salon until auth is wired. */
export const PLATFORM_DEMO_SALON_SLUG = "glow-hair";
