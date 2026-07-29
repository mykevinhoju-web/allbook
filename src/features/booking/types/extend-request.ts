export type ExtendRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled";

export interface BookingExtendRequest {
  id: string;
  bookingId: string;
  minutes: number;
  status: ExtendRequestStatus;
  paymentMethod: "cash" | "card" | null;
  priceCents: number | null;
  createdAt: string;
  resolvedAt: string | null;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerPostcode: string | null;
  customerEmail: string | null;
  bookingStartsAt: string;
  bookingEndsAt: string;
  bookingDurationMinutes: number;
}

export interface ExtendRequestAlertPayload {
  requestId: string;
  bookingId: string;
  minutes: number;
  staffName: string;
  roomName: string;
  customerName: string | null;
  requestedAt: string;
}

export interface ExtendRequestResolvedPayload {
  requestId: string;
  bookingId: string;
  status: "approved" | "rejected" | "cancelled";
  minutes: number;
  newEndsAt?: string;
  resolvedAt: string;
}
