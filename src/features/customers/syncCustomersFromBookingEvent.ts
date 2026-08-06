/**
 * Bridge: booking engine → CRM statistics.
 * Call after create/update/cancel — never from React UI directly.
 */
import { upsertCustomerFromBooking } from "./syncFromBooking";
import type { BookingCustomerSyncInput, SalonCustomer } from "./types";

export type SyncCustomersStore = {
  getAll: () => SalonCustomer[];
  setAll: (customers: SalonCustomer[]) => void;
};

/**
 * Apply a booking lifecycle event to the CRM store.
 * Completed bookings update spend / last visit / favourites.
 */
export function syncCustomersFromBookingEvent(
  store: SyncCustomersStore,
  input: BookingCustomerSyncInput,
): SalonCustomer {
  const { customers, customer } = upsertCustomerFromBooking(
    store.getAll(),
    input,
  );
  store.setAll(customers);
  return customer;
}
