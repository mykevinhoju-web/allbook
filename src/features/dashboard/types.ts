export type DashboardBookingStatus =
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "pending";

export type DashboardBooking = {
  id: string;
  customerName: string;
  service: string;
  staff: string;
  time: string;
  date: string;
  status: DashboardBookingStatus;
  amount: number;
};

export type DashboardStatTrend = {
  label: string;
  value: number;
  direction: "up" | "down" | "flat";
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  trend?: DashboardStatTrend;
};

export type DashboardQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

export type DashboardCalendarSlot = {
  time: string;
  booking: {
    id: string;
    customerName: string;
    service: string;
    staff: string;
  } | null;
};

export type DashboardPerformanceMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: "up" | "down" | "flat";
};

export type DashboardReviewSummary = {
  averageRating: number;
  pendingCount: number;
  totalReviews: number;
  recentHighlight: string;
};

export type SalonOwnerSession = {
  salonId: string;
  salonName: string;
  ownerName: string;
  ownerEmail: string;
  categoryLabel: string;
  publicPath: string;
};

export type SalonDashboardData = {
  session: SalonOwnerSession;
  stats: DashboardStat[];
  performance: DashboardPerformanceMetric[];
  recentBookings: DashboardBooking[];
  upcoming: DashboardBooking[];
  calendar: DashboardCalendarSlot[];
  reviews: DashboardReviewSummary;
  quickActions: DashboardQuickAction[];
};
