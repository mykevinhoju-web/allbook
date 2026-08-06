/** Day of week: 0 = Monday … 6 = Sunday (booking-engine friendly). */
export type StaffDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type StaffRole =
  | "Owner"
  | "Senior Stylist"
  | "Stylist"
  | "Junior Stylist"
  | "Barber"
  | "Nail Artist"
  | "Beautician"
  | "Receptionist";

export type StaffStatus = "active" | "inactive" | "archived";

export type StaffBreakType = "lunch" | "coffee" | "custom";

export type StaffLeaveType = "annual" | "sick" | "holiday" | "custom";

export type StaffWorkingDay = {
  dayOfWeek: StaffDayOfWeek;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
};

export type StaffBreak = {
  id: string;
  dayOfWeek: StaffDayOfWeek;
  startTime: string;
  endTime: string;
  breakType: StaffBreakType;
  label: string;
};

export type StaffLeave = {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: StaffLeaveType;
  reason: string;
};

export type StaffAssignedService = {
  id: string;
  name: string;
  category: string;
};

export type SalonStaffMember = {
  id: string;
  salonId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photo: string | null;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  experience: number;
  rating: number;
  languages: string[];
  specialties: string[];
  bio: string;
  instagram: string;
  certificates: string[];
  portfolioImages: string[];
  workingHours: StaffWorkingDay[];
  breaks: StaffBreak[];
  leaves: StaffLeave[];
  serviceIds: string[];
  services: StaffAssignedService[];
  bookingEnabled: boolean;
  maxDailyBookings: number | null;
  maxWeeklyBookings: number | null;
  bufferMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type StaffInput = {
  firstName: string;
  lastName: string;
  displayName?: string;
  photo?: string | null;
  email?: string;
  phone?: string;
  role: StaffRole;
  status?: StaffStatus;
  experience?: number;
  rating?: number;
  languages?: string[];
  specialties?: string[];
  bio?: string;
  instagram?: string;
  certificates?: string[];
  portfolioImages?: string[];
  workingHours?: StaffWorkingDay[];
  breaks?: StaffBreak[];
  leaves?: StaffLeave[];
  serviceIds?: string[];
  bookingEnabled?: boolean;
  maxDailyBookings?: number | null;
  maxWeeklyBookings?: number | null;
  bufferMinutes?: number;
};

export type StaffListQuery = {
  salonId: string;
  search?: string;
  role?: StaffRole | "all";
  status?: StaffStatus | "all";
  includeArchived?: boolean;
};
