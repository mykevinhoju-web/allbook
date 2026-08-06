import type {
  DashboardBooking,
  DashboardCalendarSlot,
  DashboardPerformanceMetric,
  DashboardQuickAction,
  DashboardReviewSummary,
  DashboardStat,
  SalonOwnerSession,
} from "./types";

export const MOCK_SALON_SESSION: SalonOwnerSession = {
  salonId: "salon_glow_hair",
  salonName: "Glow Hair Studio",
  ownerName: "Sarah Chen",
  ownerEmail: "sarah@glowhair.studio",
  categoryLabel: "Hair",
  publicPath: "/hair/glow-hair",
};

export const MOCK_DASHBOARD_STATS: DashboardStat[] = [
  {
    id: "todays-bookings",
    label: "Today's Bookings",
    value: "12",
    hint: "3 still to check in",
    trend: { label: "vs yesterday", value: 8, direction: "up" },
  },
  {
    id: "upcoming",
    label: "Upcoming Appointments",
    value: "28",
    hint: "Next 7 days",
    trend: { label: "vs last week", value: 12, direction: "up" },
  },
  {
    id: "todays-revenue",
    label: "Today's Revenue",
    value: "$1,840",
    hint: "Incl. tips estimate",
    trend: { label: "vs yesterday", value: 5, direction: "up" },
  },
  {
    id: "monthly-revenue",
    label: "Monthly Revenue",
    value: "$28,420",
    hint: "August to date",
    trend: { label: "vs last month", value: 14, direction: "up" },
  },
  {
    id: "new-customers",
    label: "New Customers",
    value: "19",
    hint: "This month",
    trend: { label: "vs last month", value: 6, direction: "up" },
  },
  {
    id: "returning-customers",
    label: "Returning Customers",
    value: "64",
    hint: "This month",
    trend: { label: "vs last month", value: 3, direction: "up" },
  },
  {
    id: "average-rating",
    label: "Average Rating",
    value: "4.9",
    hint: "From 186 reviews",
    trend: { label: "30-day", value: 0, direction: "flat" },
  },
  {
    id: "pending-reviews",
    label: "Pending Reviews",
    value: "7",
    hint: "Awaiting reply",
    trend: { label: "vs last week", value: 2, direction: "down" },
  },
];

export const MOCK_PERFORMANCE: DashboardPerformanceMetric[] = [
  {
    id: "revenue",
    label: "Revenue",
    value: "$28.4k",
    change: "+14%",
    direction: "up",
  },
  {
    id: "bookings",
    label: "Bookings",
    value: "186",
    change: "+9%",
    direction: "up",
  },
  {
    id: "occupancy",
    label: "Occupancy",
    value: "78%",
    change: "+4%",
    direction: "up",
  },
  {
    id: "growth",
    label: "Customer Growth",
    value: "+22",
    change: "+11%",
    direction: "up",
  },
];

export const MOCK_RECENT_BOOKINGS: DashboardBooking[] = [
  {
    id: "bk_1001",
    customerName: "Emily Watson",
    service: "Balayage + Cut",
    staff: "Mia Park",
    time: "09:00",
    date: "2026-08-06",
    status: "checked_in",
    amount: 280,
  },
  {
    id: "bk_1002",
    customerName: "James Oliver",
    service: "Men's Cut & Style",
    staff: "Alex Kim",
    time: "09:30",
    date: "2026-08-06",
    status: "confirmed",
    amount: 65,
  },
  {
    id: "bk_1003",
    customerName: "Priya Nair",
    service: "Keratin Treatment",
    staff: "Mia Park",
    time: "10:30",
    date: "2026-08-06",
    status: "confirmed",
    amount: 320,
  },
  {
    id: "bk_1004",
    customerName: "Hannah Lee",
    service: "Blow Dry",
    staff: "Sofia Reyes",
    time: "11:00",
    date: "2026-08-06",
    status: "pending",
    amount: 55,
  },
  {
    id: "bk_1005",
    customerName: "Daniel Brooks",
    service: "Colour Refresh",
    staff: "Alex Kim",
    time: "13:00",
    date: "2026-08-06",
    status: "confirmed",
    amount: 145,
  },
  {
    id: "bk_1006",
    customerName: "Amelia Croft",
    service: "Cut & Style",
    staff: "Sofia Reyes",
    time: "14:30",
    date: "2026-08-06",
    status: "cancelled",
    amount: 95,
  },
];

export const MOCK_UPCOMING_BOOKINGS: DashboardBooking[] = [
  {
    id: "bk_2001",
    customerName: "Olivia Grant",
    service: "Full Colour",
    staff: "Mia Park",
    time: "10:00",
    date: "2026-08-07",
    status: "confirmed",
    amount: 210,
  },
  {
    id: "bk_2002",
    customerName: "Noah Patel",
    service: "Beard Trim",
    staff: "Alex Kim",
    time: "11:30",
    date: "2026-08-07",
    status: "confirmed",
    amount: 35,
  },
  {
    id: "bk_2003",
    customerName: "Chloe Nguyen",
    service: "Extensions Consult",
    staff: "Sofia Reyes",
    time: "15:00",
    date: "2026-08-08",
    status: "pending",
    amount: 0,
  },
];

const SLOT_TIMES = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
] as const;

const BOOKINGS_BY_TIME = new Map(
  MOCK_RECENT_BOOKINGS.filter((b) => b.status !== "cancelled").map((b) => [
    b.time,
    b,
  ]),
);

export const MOCK_CALENDAR_SLOTS: DashboardCalendarSlot[] = SLOT_TIMES.map(
  (time) => {
    const booking = BOOKINGS_BY_TIME.get(time);
    return {
      time,
      booking: booking
        ? {
            id: booking.id,
            customerName: booking.customerName,
            service: booking.service,
            staff: booking.staff,
          }
        : null,
    };
  },
);

export const MOCK_REVIEW_SUMMARY: DashboardReviewSummary = {
  averageRating: 4.9,
  pendingCount: 7,
  totalReviews: 186,
  recentHighlight:
    "“Mia took her time and the balayage looks incredible. Booking was seamless.”",
};

export const MOCK_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    id: "add-service",
    label: "Add Service",
    description: "Grow your menu",
    href: "/platform/salon/services",
  },
  {
    id: "add-staff",
    label: "Add Staff",
    description: "Invite your team",
    href: "/platform/salon/staff",
  },
  {
    id: "open-calendar",
    label: "Open Calendar",
    description: "Today’s schedule",
    href: "/platform/salon/calendar",
  },
  {
    id: "upload-photos",
    label: "Upload Photos",
    description: "Refresh gallery",
    href: "/platform/salon/gallery",
  },
  {
    id: "edit-business",
    label: "Edit Business",
    description: "Hours & details",
    href: "/platform/salon/business",
  },
];
