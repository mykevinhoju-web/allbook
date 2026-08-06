/**
 * Compatibility re-exports. Prefer getBookingSalonContext for live data.
 */
export type {
  BookingCatalogService,
  BookingCatalogStaff,
  BookingSalonContext,
} from "./catalog-types";
export { openingHoursForDate } from "./opening-hours";
export { buildAvailabilityInput as buildStaffAvailabilityInput } from "./generateAvailableSlots";

import type { BookingSalonContext } from "./catalog-types";

/** @deprecated Empty stub — use getBookingSalonContext */
export function getMockBookingSalonContext(): BookingSalonContext {
  return {
    salonId: "",
    salonName: "",
    slug: "",
    categorySlug: "hair",
    openingHours: {},
    services: [],
    staff: [],
    seedBookingsByStaffDate: {},
  };
}
