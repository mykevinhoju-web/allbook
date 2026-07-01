import type { BookingStatus } from "@/types";

export interface Booking {
  id: string;
  shopId: string;
  serviceId: string;
  staffId: string | null;
  customerId: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
}
