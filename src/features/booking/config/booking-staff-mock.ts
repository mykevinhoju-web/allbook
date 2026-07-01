export interface BookingStaffItem {
  id: string;
  name: string;
  role: string;
  initials: string;
  accent: string;
  available: boolean;
}

export const bookingStaffMock: BookingStaffItem[] = [
  {
    id: "staff-001",
    name: "Emma Chen",
    role: "Senior Therapist",
    initials: "EC",
    accent: "from-sky-200 via-sky-300 to-blue-400",
    available: true,
  },
  {
    id: "staff-002",
    name: "Sophia Lee",
    role: "Massage Specialist",
    initials: "SL",
    accent: "from-violet-200 via-violet-300 to-purple-400",
    available: true,
  },
  {
    id: "staff-003",
    name: "Olivia Park",
    role: "Beauty Therapist",
    initials: "OP",
    accent: "from-rose-200 via-rose-300 to-pink-400",
    available: true,
  },
  {
    id: "staff-004",
    name: "Charlotte Williams",
    role: "Spa Therapist",
    initials: "CW",
    accent: "from-emerald-200 via-emerald-300 to-teal-400",
    available: true,
  },
  {
    id: "staff-005",
    name: "Isabella Nguyen",
    role: "Nail & Beauty",
    initials: "IN",
    accent: "from-amber-200 via-amber-300 to-orange-400",
    available: false,
  },
];
