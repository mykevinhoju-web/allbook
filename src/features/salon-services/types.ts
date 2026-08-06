/**
 * Salon owner services domain.
 * Duration minutes are the booking-engine slot length source of truth.
 */

export type ServiceCategory =
  | "Hair Cut"
  | "Hair Colour"
  | "Treatment"
  | "Perm"
  | "Styling"
  | "Extensions"
  | "Kids"
  | "Consultation";

export type ServicePriceType = "fixed" | "from" | "range";

export type ServiceStatus = "active" | "inactive" | "archived";

export type ServiceStaffMember = {
  id: string;
  name: string;
};

export type SalonService = {
  id: string;
  salonId: string;
  name: string;
  category: ServiceCategory;
  description: string;
  /** Minutes — booking engine uses this to calculate available slots. */
  duration: number;
  price: number;
  /** Upper bound when priceType is `range`. */
  priceMax: number | null;
  priceType: ServicePriceType;
  staffIds: string[];
  staff: ServiceStaffMember[];
  displayOrder: number;
  status: ServiceStatus;
  featured: boolean;
  bookingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInput = {
  name: string;
  category: ServiceCategory;
  description?: string;
  duration: number;
  price: number;
  priceMax?: number | null;
  priceType: ServicePriceType;
  staffIds: string[];
  displayOrder?: number;
  status?: ServiceStatus;
  featured?: boolean;
  bookingEnabled?: boolean;
};

export type ServiceListQuery = {
  salonId: string;
  category?: ServiceCategory | "all";
  search?: string;
  includeArchived?: boolean;
};
