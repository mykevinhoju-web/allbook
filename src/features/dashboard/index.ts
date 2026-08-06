/**
 * Client-safe dashboard barrel.
 * Server loaders (getDashboard, getOwnerSalon, …) must be imported from their files.
 */
export { DASHBOARD_QUICK_ACTIONS } from "./quick-actions";
export { SALON_DASHBOARD_NAV, isSalonNavActive } from "./navigation";
export { SalonDashboardShell, SalonDashboardHome } from "./salon-dashboard-shell";
export { SalonDashboardPlaceholder } from "./salon-dashboard-placeholder";
export type { SalonDashboardNavItem } from "./navigation";
export type {
  DashboardBooking,
  DashboardBookingStatus,
  DashboardCalendarSlot,
  DashboardPerformanceMetric,
  DashboardQuickAction,
  DashboardReviewSummary,
  DashboardStat,
  DashboardStatTrend,
  SalonDashboardData,
  SalonOwnerSession,
} from "./types";
