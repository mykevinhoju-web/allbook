import { MOCK_SALON_SESSION } from "@/features/dashboard/mock-data";
import { MOCK_SERVICES } from "@/features/salon-services/mock-data";
import { MOCK_SALON_STAFF } from "@/features/salon-staff/mock-data";
import type { OpeningHours } from "@/types/salon";

import type {
  BusinessHoursDay,
  ExistingBookingBlock,
} from "./types";
import { getDayOfWeekMondayFirst } from "./time-utils";

export type BookingCatalogService = {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  priceLabel: string;
  description: string;
};

export type BookingCatalogStaff = {
  id: string;
  displayName: string;
  role: string;
  photo: string | null;
  serviceIds: string[];
  bookingEnabled: boolean;
  bufferMinutes: number;
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isDayOff: boolean;
  }[];
  breaks: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  leaves: {
    startDate: string;
    endDate: string;
  }[];
};

export type BookingSalonContext = {
  salonId: string;
  salonName: string;
  slug: string;
  openingHours: OpeningHours;
  services: BookingCatalogService[];
  staff: BookingCatalogStaff[];
  /** Seed bookings used when repository has none (demo) */
  seedBookingsByStaffDate: Record<string, ExistingBookingBlock[]>;
};

function money(n: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
}

const defaultOpeningHours: OpeningHours = {
  mon: { open: "09:00", close: "18:00", closed: false },
  tue: { open: "09:00", close: "18:00", closed: false },
  wed: { open: "09:00", close: "18:00", closed: false },
  thu: { open: "09:00", close: "18:00", closed: false },
  fri: { open: "09:00", close: "18:00", closed: false },
  sat: { open: "09:00", close: "17:00", closed: false },
  sun: { open: "10:00", close: "16:00", closed: true },
};

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function openingHoursForDate(
  hours: OpeningHours,
  dateIso: string,
): BusinessHoursDay {
  const day = getDayOfWeekMondayFirst(dateIso);
  const key = DAY_KEYS[day]!;
  const value = hours[key];
  if (!value) return { open: "09:00", close: "17:00", closed: true };
  return {
    open: value.open,
    close: value.close,
    closed: value.closed,
  };
}

/**
 * Demo catalog for Glow Hair Studio booking flow.
 * Staff/service IDs align with owner dashboard mocks.
 */
export function getMockBookingSalonContext(): BookingSalonContext {
  const bookableServices = MOCK_SERVICES.filter(
    (s) => s.status === "active" && s.bookingEnabled,
  );

  return {
    salonId: MOCK_SALON_SESSION.salonId,
    salonName: MOCK_SALON_SESSION.salonName,
    slug: "glow-hair-studio",
    openingHours: defaultOpeningHours,
    services: bookableServices.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      duration: s.duration,
      price: s.price,
      priceLabel: money(s.price),
      description: s.description,
    })),
    staff: MOCK_SALON_STAFF.filter((s) => s.status === "active").map((s) => ({
      id: s.id,
      displayName: s.displayName,
      role: s.role,
      photo: s.photo,
      serviceIds: s.serviceIds,
      bookingEnabled: s.bookingEnabled,
      bufferMinutes: s.bufferMinutes,
      workingHours: s.workingHours,
      breaks: s.breaks.map((b) => ({
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      leaves: s.leaves.map((l) => ({
        startDate: l.startDate,
        endDate: l.endDate,
      })),
    })),
    seedBookingsByStaffDate: {
      // Emma example: existing 09:30–10:30 on a weekday demo date
      [`staff_emma:2026-08-10`]: [
        {
          startTime: "09:30",
          endTime: "10:30",
          bufferMinutes: 10,
          status: "confirmed",
        },
      ],
    },
  };
}

export function buildStaffAvailabilityInput(options: {
  context: BookingSalonContext;
  staffId: string;
  serviceDuration: number;
  date: string;
  existingBookings?: ExistingBookingBlock[];
}) {
  const staff = options.context.staff.find((s) => s.id === options.staffId);
  if (!staff) throw new Error("Staff not found.");

  const day = getDayOfWeekMondayFirst(options.date);
  const hours = staff.workingHours.find((h) => h.dayOfWeek === day) ?? {
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "17:00",
    isDayOff: true,
  };

  const seedKey = `${options.staffId}:${options.date}`;
  const seededExplicit =
    options.existingBookings ??
    options.context.seedBookingsByStaffDate[seedKey];

  // Demo: Emma has a standing Monday 09:30–10:30 booking (matches engine docs).
  const seededDemo =
    !seededExplicit &&
    options.staffId === "staff_emma" &&
    getDayOfWeekMondayFirst(options.date) === 0
      ? [
          {
            startTime: "09:30",
            endTime: "10:30",
            bufferMinutes: 10,
            status: "confirmed" as const,
          },
        ]
      : [];

  return {
    date: options.date,
    serviceDurationMinutes: options.serviceDuration,
    bufferMinutes: staff.bufferMinutes,
    businessHours: openingHoursForDate(
      options.context.openingHours,
      options.date,
    ),
    staffHours: {
      startTime: hours.startTime,
      endTime: hours.endTime,
      isDayOff: hours.isDayOff,
    },
    staffBreaks: staff.breaks
      .filter((b) => b.dayOfWeek === day)
      .map((b) => ({ startTime: b.startTime, endTime: b.endTime })),
    staffLeaves: staff.leaves,
    existingBookings: seededExplicit ?? seededDemo,
  };
}
