import type { OpeningHours } from "@/types/salon";

import type { ExistingBookingBlock } from "./types";

export type BookingCatalogService = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  priceLabel: string;
  description: string;
};

export type BookingCatalogStaff = {
  id: string;
  displayName: string;
  role: string;
  photo: string | null;
  serviceIds: string[];
  bookingEnabled: boolean;
  bufferMinutes: number;
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isDayOff: boolean;
  }[];
  breaks: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  leaves: {
    startDate: string;
    endDate: string;
  }[];
};

export type BookingSalonContext = {
  salonId: string;
  salonName: string;
  slug: string;
  categorySlug: string;
  openingHours: OpeningHours;
  services: BookingCatalogService[];
  staff: BookingCatalogStaff[];
  /** Optional demo/seed blocks — prefer live repository bookings */
  seedBookingsByStaffDate: Record<string, ExistingBookingBlock[]>;
};

export const NO_PREFERENCE_STAFF_ID = "__any__";

export function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}
