import { CUSTOMER_TAGS, customerFullName } from "./constants";
import type {
  CustomerBookingSummary,
  CustomerGender,
  CustomerMedia,
  CustomerNote,
  CustomerStatistics,
  CustomerStatus,
  CustomerTag,
  CustomerTimelineEvent,
  SalonCustomer,
} from "./types";

export type CustomerRow = {
  id: string;
  salon_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  first_name: string | null;
  last_name: string | null;
  birthday: string | null;
  gender: CustomerGender | null;
  avatar: string | null;
  status: CustomerStatus;
  preferred_staff_id: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
};

export function hhmm(value: string): string {
  return value.slice(0, 5);
}

export function mapCustomerTags(raw: string[]): CustomerTag[] {
  return raw.filter((t): t is CustomerTag =>
    (CUSTOMER_TAGS as string[]).includes(t),
  );
}

export function emptyStatistics(
  partial: Partial<CustomerStatistics> = {},
): CustomerStatistics {
  return {
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0,
    averageSpent: 0,
    lastVisit: null,
    nextBooking: null,
    preferredStaffId: null,
    preferredStaffName: null,
    favoriteServiceId: null,
    favoriteServiceName: null,
    ...partial,
  };
}

export function mapCustomerRow(
  row: CustomerRow,
  extras: {
    tags?: CustomerTag[];
    statistics?: CustomerStatistics;
    notes?: CustomerNote[];
    timeline?: CustomerTimelineEvent[];
    media?: CustomerMedia[];
    bookingHistory?: CustomerBookingSummary[];
    upcomingBookings?: CustomerBookingSummary[];
    cancelledBookings?: CustomerBookingSummary[];
    favouriteServices?: string[];
  } = {},
): SalonCustomer {
  const firstName =
    row.first_name?.trim() ||
    row.full_name.trim().split(/\s+/)[0] ||
    row.full_name.trim();
  const lastName =
    row.last_name?.trim() ||
    row.full_name.trim().split(/\s+/).slice(1).join(" ") ||
    "";
  const fullName =
    customerFullName(firstName, lastName) || row.full_name.trim();

  return {
    id: row.id,
    salonId: row.salon_id,
    firstName,
    lastName,
    fullName,
    phone: row.phone ?? "",
    email: row.email ?? "",
    birthday: row.birthday,
    gender: row.gender,
    avatar: row.avatar,
    status: row.status,
    joinedAt: row.created_at,
    updatedAt: row.updated_at,
    tags: extras.tags ?? [],
    loyaltyPoints: row.loyalty_points ?? 0,
    statistics: extras.statistics ?? emptyStatistics({
      preferredStaffId: row.preferred_staff_id,
    }),
    notes: extras.notes ?? [],
    timeline: extras.timeline ?? [],
    media: extras.media ?? [],
    bookingHistory: extras.bookingHistory ?? [],
    upcomingBookings: extras.upcomingBookings ?? [],
    cancelledBookings: extras.cancelledBookings ?? [],
    favouriteServices: extras.favouriteServices ?? [],
  };
}
