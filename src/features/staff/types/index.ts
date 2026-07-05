/** Legacy domain type — kept for future API integration. */
export interface StaffMember {
  id: string;
  shopId: string;
  userId: string;
  displayName: string;
  isActive: boolean;
}

export type StaffStatus = "active" | "inactive" | "on_leave";

export type StaffFilterStatus = "all" | StaffStatus;

export interface StaffPhoto {
  id: string;
  url: string;
  sortOrder: number;
}

export interface StaffAttributes {
  age?: string;
  height?: string;
  weight?: string;
  languages?: string[];
  nationality?: string;
  experience?: string;
  introduction?: string;
  username?: string;
  shiftStartsAt?: string;
  shiftEndsAt?: string;
  [key: string]: string | string[] | number | boolean | null | undefined;
}

export interface StaffRecord {
  id: string;
  name: string;
  status: StaffStatus;
  attributes: StaffAttributes;
  daySchedule: Record<string, boolean>;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  sortOrder: number;
  photos: StaffPhoto[];
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStaffRow {
  id: string;
  name: string;
  photoUrl?: string;
  status: StaffStatus;
  daySchedule: Record<string, boolean>;
  workingToday: boolean;
  nextBooking: string | null;
}

export interface StaffFormValues {
  photos: File[];
  name: string;
  age: string;
  height: string;
  weight: string;
  nationality: string;
  languages: string[];
  experience: string;
  introduction: string;
  loginId: string;
  password: string;
  daySchedule: Record<string, boolean>;
  status: StaffStatus;
}
