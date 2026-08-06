import { defaultWorkingHours, staffDisplayName } from "./constants";
import { getAssignableServices } from "./mock-data";
import type { SalonStaffMember, StaffInput } from "./types";
import { validateStaffInput } from "./validate";

export type CreateStaffOptions = {
  salonId: string;
  input: StaffInput;
};

export async function createStaff(
  options: CreateStaffOptions,
): Promise<SalonStaffMember> {
  const error = validateStaffInput(options.input);
  if (error) throw new Error(error);

  const now = new Date().toISOString();
  const serviceIds = options.input.serviceIds ?? [];
  const assignable = getAssignableServices();

  return {
    id: `staff_${crypto.randomUUID().slice(0, 8)}`,
    salonId: options.salonId,
    firstName: options.input.firstName.trim(),
    lastName: options.input.lastName.trim(),
    displayName: staffDisplayName({
      displayName: options.input.displayName,
      firstName: options.input.firstName,
      lastName: options.input.lastName,
    }),
    photo: options.input.photo ?? null,
    email: options.input.email?.trim() ?? "",
    phone: options.input.phone?.trim() ?? "",
    role: options.input.role,
    status: options.input.status ?? "active",
    experience: options.input.experience ?? 0,
    rating: options.input.rating ?? 0,
    languages: options.input.languages ?? ["English"],
    specialties: options.input.specialties ?? [],
    bio: options.input.bio?.trim() ?? "",
    instagram: options.input.instagram?.trim() ?? "",
    certificates: options.input.certificates ?? [],
    portfolioImages: options.input.portfolioImages ?? [],
    workingHours: options.input.workingHours ?? defaultWorkingHours(),
    breaks: options.input.breaks ?? [],
    leaves: options.input.leaves ?? [],
    serviceIds,
    services: assignable.filter((s) => serviceIds.includes(s.id)),
    bookingEnabled: options.input.bookingEnabled ?? true,
    maxDailyBookings: options.input.maxDailyBookings ?? null,
    maxWeeklyBookings: options.input.maxWeeklyBookings ?? null,
    bufferMinutes: options.input.bufferMinutes ?? 10,
    createdAt: now,
    updatedAt: now,
  };
}
