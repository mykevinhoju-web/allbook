import { STAFF_ROLES, defaultWorkingHours } from "./constants";
import type {
  SalonStaffMember,
  StaffAssignedService,
  StaffBreak,
  StaffBreakType,
  StaffDayOfWeek,
  StaffLeave,
  StaffLeaveType,
  StaffRole,
  StaffStatus,
  StaffWorkingDay,
} from "./types";

export type StaffRow = {
  id: string;
  salon_id: string;
  name: string;
  position: string;
  photo_url: string | null;
  years_experience: number;
  languages: string[] | null;
  specialties: string[] | null;
  sort_order: number;
  is_active: boolean;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  bio: string | null;
  instagram: string | null;
  certificates: string[] | null;
  portfolio_images: string[] | null;
  rating: number;
  booking_enabled: boolean;
  max_daily_bookings: number | null;
  max_weekly_bookings: number | null;
  buffer_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export function hhmm(value: string): string {
  return value.slice(0, 5);
}

export function mapStaffRole(raw: string): StaffRole {
  if ((STAFF_ROLES as string[]).includes(raw)) return raw as StaffRole;
  return "Stylist";
}

export function mapStaffStatus(raw: string, isActive: boolean): StaffStatus {
  if (raw === "archived") return "archived";
  if (raw === "inactive" || !isActive) return "inactive";
  return "active";
}

export function toDbStaffStatus(status: StaffStatus): {
  status: StaffStatus;
  is_active: boolean;
} {
  if (status === "archived") return { status: "archived", is_active: false };
  if (status === "inactive") return { status: "inactive", is_active: false };
  return { status: "active", is_active: true };
}

export function mapWorkingHours(
  rows: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_day_off: boolean;
  }[],
): StaffWorkingDay[] {
  const byDay = new Map(
    rows.map((r) => [
      r.day_of_week as StaffDayOfWeek,
      {
        dayOfWeek: r.day_of_week as StaffDayOfWeek,
        startTime: hhmm(r.start_time),
        endTime: hhmm(r.end_time),
        isDayOff: r.is_day_off,
      },
    ]),
  );
  return defaultWorkingHours().map(
    (day) => byDay.get(day.dayOfWeek) ?? day,
  );
}

export function mapBreaks(
  rows: {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    break_type: string | null;
    label: string | null;
  }[],
): StaffBreak[] {
  return rows.map((r) => ({
    id: r.id,
    dayOfWeek: r.day_of_week as StaffDayOfWeek,
    startTime: hhmm(r.start_time),
    endTime: hhmm(r.end_time),
    breakType: (r.break_type as StaffBreakType) || "custom",
    label: r.label ?? "",
  }));
}

export function mapLeaves(
  rows: {
    id: string;
    start_date: string;
    end_date: string;
    leave_type: string | null;
    reason: string | null;
  }[],
): StaffLeave[] {
  return rows.map((r) => ({
    id: r.id,
    startDate: r.start_date,
    endDate: r.end_date,
    leaveType: (r.leave_type as StaffLeaveType) || "custom",
    reason: r.reason ?? "",
  }));
}

export function mapStaffRow(
  row: StaffRow,
  extras: {
    workingHours?: StaffWorkingDay[];
    breaks?: StaffBreak[];
    leaves?: StaffLeave[];
    services?: StaffAssignedService[];
  } = {},
): SalonStaffMember {
  const firstName =
    row.first_name?.trim() ||
    row.name.trim().split(/\s+/)[0] ||
    row.name.trim();
  const lastName =
    row.last_name?.trim() ||
    row.name.trim().split(/\s+/).slice(1).join(" ") ||
    "";
  const displayName =
    row.display_name?.trim() ||
    `${firstName} ${lastName}`.trim() ||
    row.name.trim();
  const services = extras.services ?? [];

  return {
    id: row.id,
    salonId: row.salon_id,
    firstName,
    lastName,
    displayName,
    photo: row.photo_url,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: mapStaffRole(row.role || row.position),
    status: mapStaffStatus(row.status, row.is_active),
    experience: row.years_experience ?? 0,
    rating: Number(row.rating) || 0,
    languages: row.languages ?? ["English"],
    specialties: row.specialties ?? [],
    bio: row.bio ?? "",
    instagram: row.instagram ?? "",
    certificates: row.certificates ?? [],
    portfolioImages: row.portfolio_images ?? [],
    workingHours: extras.workingHours ?? defaultWorkingHours(),
    breaks: extras.breaks ?? [],
    leaves: extras.leaves ?? [],
    serviceIds: services.map((s) => s.id),
    services,
    bookingEnabled: row.booking_enabled,
    maxDailyBookings: row.max_daily_bookings,
    maxWeeklyBookings: row.max_weekly_bookings,
    bufferMinutes: row.buffer_minutes ?? 10,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
