import { staffDisplayName } from "./constants";
import { getAssignableServices } from "./mock-data";
import type { SalonStaffMember, StaffInput, StaffStatus } from "./types";
import { validateStaffInput } from "./validate";

export type UpdateStaffPatch = Partial<StaffInput> & {
  status?: StaffStatus;
};

export async function updateStaff(
  member: SalonStaffMember,
  patch: UpdateStaffPatch,
): Promise<SalonStaffMember> {
  const next: StaffInput = {
    firstName: patch.firstName ?? member.firstName,
    lastName: patch.lastName ?? member.lastName,
    displayName: patch.displayName ?? member.displayName,
    photo: patch.photo !== undefined ? patch.photo : member.photo,
    email: patch.email ?? member.email,
    phone: patch.phone ?? member.phone,
    role: patch.role ?? member.role,
    status: patch.status ?? member.status,
    experience: patch.experience ?? member.experience,
    rating: patch.rating ?? member.rating,
    languages: patch.languages ?? member.languages,
    specialties: patch.specialties ?? member.specialties,
    bio: patch.bio ?? member.bio,
    instagram: patch.instagram ?? member.instagram,
    certificates: patch.certificates ?? member.certificates,
    portfolioImages: patch.portfolioImages ?? member.portfolioImages,
    workingHours: patch.workingHours ?? member.workingHours,
    breaks: patch.breaks ?? member.breaks,
    leaves: patch.leaves ?? member.leaves,
    serviceIds: patch.serviceIds ?? member.serviceIds,
    bookingEnabled: patch.bookingEnabled ?? member.bookingEnabled,
    maxDailyBookings:
      patch.maxDailyBookings !== undefined
        ? patch.maxDailyBookings
        : member.maxDailyBookings,
    maxWeeklyBookings:
      patch.maxWeeklyBookings !== undefined
        ? patch.maxWeeklyBookings
        : member.maxWeeklyBookings,
    bufferMinutes: patch.bufferMinutes ?? member.bufferMinutes,
  };

  const error = validateStaffInput(next);
  if (error) throw new Error(error);

  const serviceIds = next.serviceIds ?? [];
  const assignable = getAssignableServices();

  return {
    ...member,
    firstName: next.firstName.trim(),
    lastName: next.lastName.trim(),
    displayName: staffDisplayName({
      displayName: next.displayName,
      firstName: next.firstName,
      lastName: next.lastName,
    }),
    photo: next.photo ?? null,
    email: next.email?.trim() ?? "",
    phone: next.phone?.trim() ?? "",
    role: next.role,
    status: next.status ?? member.status,
    experience: next.experience ?? 0,
    rating: next.rating ?? 0,
    languages: next.languages ?? [],
    specialties: next.specialties ?? [],
    bio: next.bio?.trim() ?? "",
    instagram: next.instagram?.trim() ?? "",
    certificates: next.certificates ?? [],
    portfolioImages: next.portfolioImages ?? [],
    workingHours: next.workingHours ?? member.workingHours,
    breaks: next.breaks ?? member.breaks,
    leaves: next.leaves ?? member.leaves,
    serviceIds,
    services: assignable.filter((s) => serviceIds.includes(s.id)),
    bookingEnabled: next.bookingEnabled ?? member.bookingEnabled,
    maxDailyBookings: next.maxDailyBookings ?? null,
    maxWeeklyBookings: next.maxWeeklyBookings ?? null,
    bufferMinutes: next.bufferMinutes ?? member.bufferMinutes,
    updatedAt: new Date().toISOString(),
  };
}

export async function duplicateStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  const now = new Date().toISOString();
  return {
    ...member,
    id: `staff_${crypto.randomUUID().slice(0, 8)}`,
    displayName: `${member.displayName} (Copy)`,
    email: "",
    bookingEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
}

export async function archiveStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(member, { status: "archived", bookingEnabled: false });
}
