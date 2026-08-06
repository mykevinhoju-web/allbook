/**
 * Hair Booking Platform — MVP database types
 *
 * Spec name → physical table:
 *   business_categories → business_categories
 *   suburbs             → suburbs
 *   salons              → salons
 *   staff               → salon_staff
 *   services            → salon_services
 *   business_hours      → business_hours
 *   customers           → salon_customers
 *   bookings            → salon_bookings
 *
 * Soft delete: filter `deleted_at IS NULL` in all app queries.
 */

export type SalonStatus =
  | "draft"
  | "pending"
  | "active"
  | "suspended"
  | "archived";

export type StaffStatus = "active" | "inactive" | "archived";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

/** 0 = Sunday … 6 = Saturday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BusinessCategory = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Suburb = {
  id: string;
  name: string;
  postcode: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Salon = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  suburb_id: string | null;
  latitude: number;
  longitude: number;
  cover_image: string | null;
  logo: string | null;
  status: SalonStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Spec: staff → table: salon_staff */
export type Staff = {
  id: string;
  salon_id: string;
  name: string;
  role: string;
  photo: string | null;
  phone: string | null;
  email: string | null;
  status: StaffStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Spec: services → table: salon_services */
export type Service = {
  id: string;
  salon_id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BusinessHours = {
  id: string;
  salon_id: string;
  day_of_week: DayOfWeek;
  open_time: string | null;
  close_time: string | null;
  closed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Spec: customers → table: salon_customers */
export type Customer = {
  id: string;
  salon_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Spec: bookings → table: salon_bookings */
export type Booking = {
  id: string;
  salon_id: string;
  customer_id: string | null;
  staff_id: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Physical table names used in Supabase queries */
export const MVP_TABLES = {
  business_categories: "business_categories",
  suburbs: "suburbs",
  salons: "salons",
  staff: "salon_staff",
  services: "salon_services",
  business_hours: "business_hours",
  customers: "salon_customers",
  bookings: "salon_bookings",
} as const;

export type MvpTableName = (typeof MVP_TABLES)[keyof typeof MVP_TABLES];
