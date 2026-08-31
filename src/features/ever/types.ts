export type EverBookingStatus = "pending" | "confirmed" | "cancelled";

export interface EverService {
  id: string;
  name: string;
  durationMinutes: number;
  priceCents: number | null;
  sortOrder: number;
  isActive: boolean;
}

export interface EverSiteBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  startsAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerPostcode: string;
  status: EverBookingStatus;
  createdAt: string;
}
