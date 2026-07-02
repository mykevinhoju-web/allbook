export interface AdminBooking {
  id: string;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerPostcode: string | null;
  customerEmail: string | null;
  notes: string | null;
}

export interface AdminRoom {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}
