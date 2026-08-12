export interface AdminBooking {
  id: string;
  staffId: string;
  staffName: string;
  roomId: string | null;
  roomName: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
  status: string;
  checkedOutAt: string | null;
  checkedInAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerPostcode: string | null;
  customerEmail: string | null;
  notes: string | null;
  /** Admin walk-in: cash (discount eligible) or card (no discount). */
  paymentMethod?: "cash" | "card" | null;
  /** Extra staff joined on this booking (excludes primary). */
  additionalStaff?: { id: string; name: string }[];
  /** Off-site service — no treatment room. */
  outCall?: boolean;
  /** External / guest staff (not on regular roster). */
  otherStaff?: boolean;
  /** Display name entered for other staff. */
  otherStaffName?: string | null;
}

export interface AdminRoom {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  tabletClaimed?: boolean;
  claimedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
