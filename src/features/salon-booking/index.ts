export { generateTimeSlots, getSlotEndTime } from "./generateTimeSlots";
export {
  generateAvailableSlots,
  buildAvailabilityInput,
  pickStaffForSlot,
  isBookingDateDisabled,
  resolveStaffCandidates,
} from "./generateAvailableSlots";
export { checkAvailability } from "./checkAvailability";
export {
  createBooking,
  BookingConflictError,
  BookingValidationError,
} from "./createBooking";
export { cancelBooking } from "./cancelBooking";
export { updateBooking } from "./updateBooking";
export { getBookingSalonContext } from "./getBookingSalonContext";
export {
  createMemorySalonBookingsRepository,
} from "./repositories/memory";
export {
  createSupabaseSalonBookingsRepository,
} from "./repositories/supabase";
export { BookingWizard } from "./booking-wizard";
export {
  NO_PREFERENCE_STAFF_ID,
  formatAud,
} from "./catalog-types";
export type {
  BookingCatalogService,
  BookingCatalogStaff,
  BookingSalonContext,
} from "./catalog-types";
export {
  SLOT_INTERVAL_MINUTES,
  parseTimeToMinutes,
  formatMinutesToTime,
  getDayOfWeekMondayFirst,
} from "./time-utils";
export type {
  BookingStatus,
  BusinessHoursDay,
  CheckAvailabilityInput,
  CheckAvailabilityResult,
  CreateBookingInput,
  ExistingBookingBlock,
  GenerateTimeSlotsInput,
  SalonBooking,
  TimeSlot,
  UpdateBookingInput,
} from "./types";
export type { SalonBookingsRepository } from "./repositories/types";
