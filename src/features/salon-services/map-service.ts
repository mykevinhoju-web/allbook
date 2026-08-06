import { SERVICE_CATEGORIES } from "./constants";
import type {
  SalonService,
  ServiceCategory,
  ServicePriceType,
  ServiceStaffMember,
  ServiceStatus,
} from "./types";

export type SalonServiceRow = {
  id: string;
  salon_id: string;
  category: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  price_max: number | null;
  price_type: string;
  sort_order: number;
  is_active: boolean;
  booking_enabled: boolean;
  featured: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export function mapServiceCategory(raw: string): ServiceCategory {
  if ((SERVICE_CATEGORIES as string[]).includes(raw)) {
    return raw as ServiceCategory;
  }
  return "Consultation";
}

export function mapServiceStatus(raw: string, isActive: boolean): ServiceStatus {
  if (raw === "archived") return "archived";
  if (raw === "inactive" || !isActive) return "inactive";
  return "active";
}

export function mapPriceType(raw: string): ServicePriceType {
  if (raw === "from" || raw === "range") return raw;
  return "fixed";
}

export function mapSalonServiceRow(
  row: SalonServiceRow,
  staff: ServiceStaffMember[] = [],
): SalonService {
  const staffIds = staff.map((s) => s.id);
  return {
    id: row.id,
    salonId: row.salon_id,
    name: row.name,
    category: mapServiceCategory(row.category),
    description: row.description ?? "",
    duration: row.duration_minutes,
    price: row.price,
    priceMax: row.price_max,
    priceType: mapPriceType(row.price_type),
    staffIds,
    staff,
    displayOrder: row.sort_order,
    status: mapServiceStatus(row.status, row.is_active),
    featured: row.featured,
    bookingEnabled: row.booking_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDbStatus(status: ServiceStatus): {
  status: ServiceStatus;
  is_active: boolean;
} {
  if (status === "archived") return { status: "archived", is_active: false };
  if (status === "inactive") return { status: "inactive", is_active: false };
  return { status: "active", is_active: true };
}
