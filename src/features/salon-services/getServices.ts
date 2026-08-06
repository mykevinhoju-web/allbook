import { MOCK_SERVICE_STAFF, MOCK_SERVICES } from "./mock-data";
import type { SalonService, ServiceListQuery } from "./types";

function matchesSearch(service: SalonService, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;

  const priceText = String(service.price);
  return (
    service.name.toLowerCase().includes(q) ||
    service.category.toLowerCase().includes(q) ||
    priceText.includes(q) ||
    formatLoosePrice(service.price).includes(q)
  );
}

function formatLoosePrice(price: number): string {
  return `$${price}`;
}

/**
 * List salon services for the owner dashboard.
 * Mock-backed for now — swap to Supabase `salon_services` when owner auth is live.
 */
export async function getServices(
  query: ServiceListQuery,
): Promise<SalonService[]> {
  let rows = MOCK_SERVICES.filter((s) => s.salonId === query.salonId);

  if (!query.includeArchived) {
    rows = rows.filter((s) => s.status !== "archived");
  }

  if (query.category && query.category !== "all") {
    rows = rows.filter((s) => s.category === query.category);
  }

  if (query.search?.trim()) {
    rows = rows.filter((s) => matchesSearch(s, query.search!));
  }

  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getServiceStaffOptions() {
  return MOCK_SERVICE_STAFF;
}

/** Booking engine: duration minutes for slot math. */
export function getServiceDurationMinutes(service: SalonService): number {
  return service.duration;
}
