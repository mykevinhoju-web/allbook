export type CustomerStatus = "vip" | "regular" | "inactive" | "blocked";

export type CustomerGender =
  | "female"
  | "male"
  | "non_binary"
  | "prefer_not"
  | "other";

export type CustomerTag =
  | "VIP"
  | "Student"
  | "Senior"
  | "Colour Client"
  | "Weekly Client"
  | "Monthly Client";

export type CustomerTimelineEventType =
  | "booking_created"
  | "booking_completed"
  | "booking_cancelled"
  | "review_submitted"
  | "payment_completed"
  | "note_added"
  | "status_changed";

export type CustomerStatistics = {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  averageSpent: number;
  lastVisit: string | null;
  nextBooking: string | null;
  preferredStaffId: string | null;
  preferredStaffName: string | null;
  favoriteServiceId: string | null;
  favoriteServiceName: string | null;
};

export type CustomerNote = {
  id: string;
  customerId: string;
  staffId: string | null;
  staffName: string | null;
  note: string;
  createdAt: string;
};

export type CustomerTimelineEvent = {
  id: string;
  customerId: string;
  eventType: CustomerTimelineEventType;
  title: string;
  detail: string | null;
  bookingId: string | null;
  createdAt: string;
};

export type CustomerMedia = {
  id: string;
  url: string;
  mediaType: "before" | "after" | "upload";
  caption: string | null;
  createdAt: string;
};

export type CustomerBookingSummary = {
  id: string;
  serviceName: string;
  staffName: string;
  bookingDate: string;
  startTime: string;
  status: string;
  amount: number;
};

export type SalonCustomer = {
  id: string;
  salonId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  birthday: string | null;
  gender: CustomerGender | null;
  avatar: string | null;
  status: CustomerStatus;
  joinedAt: string;
  updatedAt: string;
  tags: CustomerTag[];
  statistics: CustomerStatistics;
  notes: CustomerNote[];
  timeline: CustomerTimelineEvent[];
  media: CustomerMedia[];
  bookingHistory: CustomerBookingSummary[];
  upcomingBookings: CustomerBookingSummary[];
  cancelledBookings: CustomerBookingSummary[];
  favouriteServices: string[];
  loyaltyPoints: number;
};

export type CustomerListQuery = {
  salonId: string;
  search?: string;
  status?: CustomerStatus | "all";
  tag?: CustomerTag | "all";
  sort?: "name" | "last_visit" | "total_spent" | "joined";
  sortDir?: "asc" | "desc";
};

export type CustomerInput = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  birthday?: string | null;
  gender?: CustomerGender | null;
  avatar?: string | null;
  status?: CustomerStatus;
  tags?: CustomerTag[];
};

export type BookingCustomerSyncInput = {
  salonId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingId: string;
  bookingDate: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  amount: number;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
};
