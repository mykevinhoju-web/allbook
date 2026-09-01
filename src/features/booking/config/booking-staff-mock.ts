export interface BookingStaffItem {
  id: string;
  name: string;
  role: string;
  initials: string;
  photoUrl: string;
  photos?: string[];
  available: boolean;
  availabilityTier?: "now" | "soon" | "tomorrow" | "later" | "none";
  availabilityLabel?: string;
  availabilityDetail?: string | null;
}

/** Demo portraits for platform preview — Unsplash (not real staff / not dayspa). */
export const bookingStaffMock: BookingStaffItem[] = [
  {
    id: "demo-emma",
    name: "Emma Chen",
    role: "Senior Therapist",
    initials: "EC",
    photoUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=400&q=80",
    available: true,
  },
  {
    id: "demo-sophia",
    name: "Sophia Lee",
    role: "Massage Specialist",
    initials: "SL",
    photoUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&h=400&q=80",
    available: true,
  },
  {
    id: "demo-olivia",
    name: "Olivia Park",
    role: "Beauty Therapist",
    initials: "OP",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
    available: true,
  },
  {
    id: "demo-charlotte",
    name: "Charlotte Williams",
    role: "Spa Therapist",
    initials: "CW",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
    available: true,
  },
  {
    id: "demo-isabella",
    name: "Isabella Nguyen",
    role: "Wellness Therapist",
    initials: "IN",
    photoUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&h=400&q=80",
    available: true,
  },
];

export const DEMO_SERVICE_OPTIONS = [
  { durationMinutes: 30, label: "30 min", priceCents: 6500 },
  { durationMinutes: 45, label: "45 min", priceCents: 9000 },
  { durationMinutes: 60, label: "60 min", priceCents: 11000 },
  { durationMinutes: 90, label: "90 min", priceCents: 15000 },
] as const;

export function getDemoStaffById(id: string): BookingStaffItem | undefined {
  return bookingStaffMock.find((member) => member.id === id);
}

/** Simple free time slots for a date (no availability API). */
export function buildDemoTimeSlots(date: string): { value: string; label: string }[] {
  if (!date) return [];
  const slots: { value: string; label: string }[] = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 17 && minute === 30) continue;
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      const value = `${date}T${hh}:${mm}`;
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      slots.push({
        value,
        label: `${displayHour}:${mm} ${period}`,
      });
    }
  }
  return slots;
}
