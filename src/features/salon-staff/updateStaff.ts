import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { staffDisplayName } from "./constants";
import {
  replaceBreaks,
  replaceLeaves,
  replaceServices,
  replaceWorkingHours,
  createStaff,
} from "./createStaff";
import { getAssignableServices } from "./getStaff";
import { mapStaffRow, toDbStaffStatus, type StaffRow } from "./map-staff";
import type {
  SalonStaffMember,
  StaffInput,
  StaffStatus,
} from "./types";
import { validateStaffInput } from "./validate";

type AnySupabase = SupabaseClient<Database>;

export type UpdateStaffPatch = Partial<StaffInput> & {
  status?: StaffStatus;
};

export async function updateStaff(
  supabase: AnySupabase,
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

  const displayName = staffDisplayName({
    displayName: next.displayName,
    firstName: next.firstName,
    lastName: next.lastName,
  });
  const dbStatus = toDbStaffStatus(next.status ?? member.status);
  const serviceIds = next.serviceIds ?? [];
  const workingHours = next.workingHours ?? member.workingHours;
  const breaks = next.breaks ?? member.breaks;
  const leaves = next.leaves ?? member.leaves;

  const { data, error: updateError } = await supabase
    .from("salon_staff")
    .update({
      name: displayName,
      position: next.role,
      role: next.role,
      first_name: next.firstName.trim(),
      last_name: next.lastName.trim(),
      display_name: displayName,
      photo_url: next.photo ?? null,
      email: next.email?.trim() || null,
      phone: next.phone?.trim() || null,
      years_experience: next.experience ?? 0,
      languages: next.languages ?? ["English"],
      specialties: next.specialties ?? [],
      bio: next.bio?.trim() || null,
      instagram: next.instagram?.trim() || null,
      certificates: next.certificates ?? [],
      portfolio_images: next.portfolioImages ?? [],
      rating: next.rating ?? 0,
      booking_enabled: next.bookingEnabled ?? true,
      max_daily_bookings: next.maxDailyBookings ?? null,
      max_weekly_bookings: next.maxWeeklyBookings ?? null,
      buffer_minutes: next.bufferMinutes ?? 10,
      status: dbStatus.status,
      is_active: dbStatus.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id)
    .eq("salon_id", member.salonId)
    .select("*")
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Could not update staff.");
  }

  await Promise.all([
    replaceWorkingHours(supabase, member.id, workingHours),
    replaceBreaks(supabase, member.id, breaks),
    replaceLeaves(supabase, member.id, leaves),
    replaceServices(supabase, member.id, serviceIds),
  ]);

  const assignable = await getAssignableServices(supabase, member.salonId);

  return mapStaffRow(data as StaffRow, {
    workingHours,
    breaks,
    leaves,
    services: assignable.filter((s) => serviceIds.includes(s.id)),
  });
}

export async function duplicateStaff(
  supabase: AnySupabase,
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return createStaff({
    supabase,
    salonId: member.salonId,
    input: {
      firstName: member.firstName,
      lastName: member.lastName,
      displayName: `${member.displayName} (Copy)`,
      photo: member.photo,
      email: "",
      phone: member.phone,
      role: member.role,
      status: member.status === "archived" ? "inactive" : member.status,
      experience: member.experience,
      rating: member.rating,
      languages: member.languages,
      specialties: member.specialties,
      bio: member.bio,
      instagram: member.instagram,
      certificates: member.certificates,
      portfolioImages: member.portfolioImages,
      workingHours: member.workingHours,
      breaks: member.breaks.map((b) => ({
        ...b,
        id: crypto.randomUUID(),
      })),
      leaves: [],
      serviceIds: member.serviceIds,
      bookingEnabled: false,
      maxDailyBookings: member.maxDailyBookings,
      maxWeeklyBookings: member.maxWeeklyBookings,
      bufferMinutes: member.bufferMinutes,
    },
  });
}

export async function archiveStaff(
  supabase: AnySupabase,
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(supabase, member, {
    status: "archived",
    bookingEnabled: false,
  });
}

export async function restoreStaff(
  supabase: AnySupabase,
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(supabase, member, {
    status: "active",
    bookingEnabled: true,
  });
}
