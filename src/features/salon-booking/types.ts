/**
 * Marketplace salon booking engine types.
 * Pure domain — no React, no DB clients.
 */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export type TimeRange = {
  /** Minutes from midnight */
  start: number;
  /** Minutes from midnight (exclusive end for occupancy) */
  end: number;
};

export type BusinessHoursDay = {
  open: string;
  close: string;
  closed: boolean;
};

export type BookingEngineStaffDay = {
  startTime: string;
  endTime: string;
  isDayOff: boolean;
};

export type BookingEngineBreak = {
  startTime: string;
  endTime: string;
};

export type BookingEngineLeave = {
  startDate: string;
  endDate: string;
};

export type ExistingBookingBlock = {
  startTime: string;
  endTime: string;
  /** Buffer that blocks after this booking ends. Defaults to engine buffer. */
  bufferMinutes?: number;
  status?: BookingStatus;
};

export type GenerateTimeSlotsInput = {
  /** YYYY-MM-DD */
  date: string;
  serviceDurationMinutes: number;
  bufferMinutes: number;
  /** Slot grid step — default 15 */
  intervalMinutes?: number;
  businessHours: BusinessHoursDay;
  staffHours: BookingEngineStaffDay;
  staffBreaks: BookingEngineBreak[];
  staffLeaves: BookingEngineLeave[];
  existingBookings: ExistingBookingBlock[];
};

export type TimeSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
};

export type CheckAvailabilityInput = GenerateTimeSlotsInput & {
  startTime: string;
};

export type CheckAvailabilityResult = {
  available: boolean;
  reason?: string;
  endTime?: string;
};

export type SalonBooking = {
  id: string;
  salonId: string;
  staffId: string;
  customerId: string | null;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  bufferMinutes: number;
  status: BookingStatus;
  notes: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBookingInput = {
  salonId: string;
  staffId: string;
  serviceId: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  bufferMinutes: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  status?: BookingStatus;
  /** Customer must accept resolved policies before confirm. */
  policyAccepted?: boolean;
  policySnapshot?: unknown | null;
  policyAcceptedAt?: string | null;
  /** Snapshot used to re-validate slots before create */
  availability: Omit<GenerateTimeSlotsInput, "serviceDurationMinutes" | "bufferMinutes"> & {
    serviceDurationMinutes?: number;
    bufferMinutes?: number;
  };
};

export type UpdateBookingInput = {
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  bufferMinutes?: number;
  staffId?: string;
  serviceId?: string;
  status?: BookingStatus;
  notes?: string | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
};
