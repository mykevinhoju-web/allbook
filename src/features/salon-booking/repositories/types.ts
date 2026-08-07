import type { SalonBooking, UpdateBookingInput } from "../types";

export type ListStaffBookingsQuery = {
  salonId: string;
  staffId: string;
  bookingDate: string;
};

export type CreateBookingRecord = Omit<
  SalonBooking,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  policySnapshot?: unknown | null;
  policyAcceptedAt?: string | null;
};

/**
 * Repository boundary — swap mock ↔ Supabase without touching engine logic.
 */
export interface SalonBookingsRepository {
  getById(id: string): Promise<SalonBooking | null>;
  listStaffBookingsForDate(
    query: ListStaffBookingsQuery,
  ): Promise<SalonBooking[]>;
  create(input: CreateBookingRecord): Promise<SalonBooking>;
  update(id: string, patch: UpdateBookingInput): Promise<SalonBooking>;
}
