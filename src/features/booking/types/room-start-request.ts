import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";

export interface RoomStartRequest {
  id: string;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerPostcode: string | null;
  customerEmail: string | null;
  durationMinutes: number;
  priceCents: number;
  requestedPayment: InternalPaymentMethod | null;
  splitCashCents: number | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface RoomStartAlertPayload {
  bookingId: string;
  staffName: string;
  roomName: string;
  customerName: string | null;
  durationMinutes: number;
  requestedAt: string;
}

export interface RoomStartResolvedPayload {
  bookingId: string;
  status: "approved" | "rejected";
  resolvedAt: string;
}
