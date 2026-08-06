import type {
  CreateBookingRecord,
  ListStaffBookingsQuery,
  SalonBookingsRepository,
} from "./types";
import type { SalonBooking, UpdateBookingInput } from "../types";

/**
 * In-memory repository for local/demo flows.
 * Not shared across serverless instances — use Supabase repo in production.
 */
export function createMemorySalonBookingsRepository(
  seed: SalonBooking[] = [],
): SalonBookingsRepository {
  const store = new Map<string, SalonBooking>(seed.map((b) => [b.id, b]));

  return {
    async getById(id) {
      return store.get(id) ?? null;
    },

    async listStaffBookingsForDate(query: ListStaffBookingsQuery) {
      return [...store.values()].filter(
        (b) =>
          b.salonId === query.salonId &&
          b.staffId === query.staffId &&
          b.bookingDate === query.bookingDate,
      );
    },

    async create(input: CreateBookingRecord) {
      const now = new Date().toISOString();
      const booking: SalonBooking = {
        ...input,
        id: input.id ?? `bk_${crypto.randomUUID().slice(0, 10)}`,
        createdAt: now,
        updatedAt: now,
      };
      store.set(booking.id, booking);
      return booking;
    },

    async update(id: string, patch: UpdateBookingInput) {
      const existing = store.get(id);
      if (!existing) throw new Error("Booking not found.");
      const next: SalonBooking = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      store.set(id, next);
      return next;
    },
  };
}
