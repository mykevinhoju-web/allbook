export interface BookingAlertPayload {
  staffId: string;
  staffName: string;
  requestedAt: string;
}

export type BookingAlertStatus = "idle" | "listening" | "error";
