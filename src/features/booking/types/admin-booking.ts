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
  /** Admin walk-in payment: cash, card, split, or unpaid pre booking. */
  paymentMethod?: "cash" | "card" | "split" | "pre" | null;
  /** Cash portion in cents when paymentMethod is split. */
  splitCashCents?: number | null;
  /** Stripe / walk-in payment status (pre bookings use unpaid). */
  paymentStatus?: string | null;
  /** Walk-in guest assigned from the daily rotation. */
  walkIn?: boolean;
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
