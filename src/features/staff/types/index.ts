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

export interface AdminStaffRow {
  id: string;
  name: string;
  photoUrl?: string;
  status: StaffStatus;
  workingToday: boolean;
  nextBooking: string | null;
}

export interface StaffFormValues {
  profilePhoto: File | null;
  galleryPhotos: File[];
  name: string;
  age: string;
  height: string;
  weight: string;
  nationality: string;
  languages: string[];
  experience: string;
  introduction: string;
  username: string;
  password: string;
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  status: StaffStatus;
}
