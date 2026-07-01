export interface BookingStaffItem {
  id: string;
  name: string;
  role: string;
  initials: string;
  photoUrl: string;
  available: boolean;
}

/** Demo portraits — Unsplash (sample UI only, not real staff). */
export const bookingStaffMock: BookingStaffItem[] = [
  {
    id: "staff-001",
    name: "Emma Chen",
    role: "Senior Therapist",
    initials: "EC",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&h=240&q=80",
    available: true,
  },
  {
    id: "staff-002",
    name: "Sophia Lee",
    role: "Massage Specialist",
    initials: "SL",
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&h=240&q=80",
    available: true,
  },
  {
    id: "staff-003",
    name: "Olivia Park",
    role: "Beauty Therapist",
    initials: "OP",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80",
    available: true,
  },
  {
    id: "staff-004",
    name: "Charlotte Williams",
    role: "Spa Therapist",
    initials: "CW",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&h=240&q=80",
    available: true,
  },
  {
    id: "staff-005",
    name: "Isabella Nguyen",
    role: "Nail & Beauty",
    initials: "IN",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&h=240&q=80",
    available: false,
  },
];
