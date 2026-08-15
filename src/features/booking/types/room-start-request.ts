export interface RoomStartRequest {
  id: string;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  customerName: string | null;
  durationMinutes: number;
  priceCents: number;
  requestedPayment: "cash" | "card" | null;
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
