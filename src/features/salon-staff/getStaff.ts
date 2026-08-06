import { MOCK_SALON_STAFF } from "./mock-data";
import type { SalonStaffMember, StaffListQuery } from "./types";

/**
 * List salon staff for the owner dashboard (mock-backed).
 * Includes schedule, breaks, leave, and service assignments for the booking engine.
 */
export async function getStaff(
  query: StaffListQuery,
): Promise<SalonStaffMember[]> {
  let rows = MOCK_SALON_STAFF.filter((s) => s.salonId === query.salonId);

  if (!query.includeArchived) {
    rows = rows.filter((s) => s.status !== "archived");
  }
  if (query.role && query.role !== "all") {
    rows = rows.filter((s) => s.role === query.role);
  }
  if (query.status && query.status !== "all") {
    rows = rows.filter((s) => s.status === query.status);
  }
  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.specialties.some((sp) => sp.toLowerCase().includes(q)) ||
        s.languages.some((l) => l.toLowerCase().includes(q)),
    );
  }

  return [...rows].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "en"),
  );
}

/** Booking engine: staff who can take appointments. */
export function getBookableStaff(
  staff: SalonStaffMember[],
): SalonStaffMember[] {
  return staff.filter((s) => s.status === "active" && s.bookingEnabled);
}
