import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { defaultWorkingHours, staffDisplayName } from "./constants";
import { getAssignableServices } from "./getStaff";
import { mapStaffRow, toDbStaffStatus, type StaffRow } from "./map-staff";
import type {
  SalonStaffMember,
  StaffBreak,
  StaffInput,
  StaffLeave,
  StaffWorkingDay,
} from "./types";
import { validateStaffInput } from "./validate";

type AnySupabase = SupabaseClient<Database>;

export type CreateStaffOptions = {
  supabase: AnySupabase;
  salonId: string;
  input: StaffInput;
};

async function replaceWorkingHours(
  supabase: AnySupabase,
  staffId: string,
  hours: StaffWorkingDay[],
) {
  const { error: delError } = await supabase
    .from("salon_staff_working_hours")
    .delete()
    .eq("staff_id", staffId);
  if (delError) throw new Error(delError.message);
  if (hours.length === 0) return;
  const { error } = await supabase.from("salon_staff_working_hours").insert(
    hours.map((h) => ({
      staff_id: staffId,
      day_of_week: h.dayOfWeek,
      start_time: h.startTime,
      end_time: h.endTime,
      is_day_off: h.isDayOff,
    })),
  );
  if (error) throw new Error(error.message);
}

async function replaceBreaks(
  supabase: AnySupabase,
  staffId: string,
  breaks: StaffBreak[],
) {
  const { error: delError } = await supabase
    .from("salon_staff_breaks")
    .delete()
    .eq("staff_id", staffId);
  if (delError) throw new Error(delError.message);
  if (breaks.length === 0) return;
  const { error } = await supabase.from("salon_staff_breaks").insert(
    breaks.map((b) => ({
      staff_id: staffId,
      day_of_week: b.dayOfWeek,
      start_time: b.startTime,
      end_time: b.endTime,
      break_type: b.breakType,
      label: b.label || null,
    })),
  );
  if (error) throw new Error(error.message);
}

async function replaceLeaves(
  supabase: AnySupabase,
  staffId: string,
  leaves: StaffLeave[],
) {
  const { error: delError } = await supabase
    .from("salon_staff_leaves")
    .delete()
    .eq("staff_id", staffId);
  if (delError) throw new Error(delError.message);
  if (leaves.length === 0) return;
  const { error } = await supabase.from("salon_staff_leaves").insert(
    leaves.map((l) => ({
      staff_id: staffId,
      start_date: l.startDate,
      end_date: l.endDate,
      leave_type: l.leaveType,
      reason: l.reason || null,
    })),
  );
  if (error) throw new Error(error.message);
}

async function replaceServices(
  supabase: AnySupabase,
  staffId: string,
  serviceIds: string[],
) {
  const { error: delError } = await supabase
    .from("salon_staff_services")
    .delete()
    .eq("staff_id", staffId);
  if (delError) throw new Error(delError.message);
  if (serviceIds.length === 0) return;
  const { error } = await supabase.from("salon_staff_services").insert(
    serviceIds.map((service_id) => ({ staff_id: staffId, service_id })),
  );
  if (error) throw new Error(error.message);
}

export async function createStaff(
  options: CreateStaffOptions,
): Promise<SalonStaffMember> {
  const error = validateStaffInput(options.input);
  if (error) throw new Error(error);

  const displayName = staffDisplayName({
    displayName: options.input.displayName,
    firstName: options.input.firstName,
    lastName: options.input.lastName,
  });
  const status = options.input.status ?? "active";
  const dbStatus = toDbStaffStatus(status);
  const serviceIds = options.input.serviceIds ?? [];
  const workingHours = options.input.workingHours ?? defaultWorkingHours();
  const breaks = options.input.breaks ?? [];
  const leaves = options.input.leaves ?? [];

  const { data, error: insertError } = await options.supabase
    .from("salon_staff")
    .insert({
      salon_id: options.salonId,
      name: displayName,
      position: options.input.role,
      role: options.input.role,
      first_name: options.input.firstName.trim(),
      last_name: options.input.lastName.trim(),
      display_name: displayName,
      photo_url: options.input.photo ?? null,
      email: options.input.email?.trim() || null,
      phone: options.input.phone?.trim() || null,
      years_experience: options.input.experience ?? 0,
      languages: options.input.languages ?? ["English"],
      specialties: options.input.specialties ?? [],
      bio: options.input.bio?.trim() || null,
      instagram: options.input.instagram?.trim() || null,
      certificates: options.input.certificates ?? [],
      portfolio_images: options.input.portfolioImages ?? [],
      rating: options.input.rating ?? 0,
      booking_enabled: options.input.bookingEnabled ?? true,
      max_daily_bookings: options.input.maxDailyBookings ?? null,
      max_weekly_bookings: options.input.maxWeeklyBookings ?? null,
      buffer_minutes: options.input.bufferMinutes ?? 10,
      status: dbStatus.status,
      is_active: dbStatus.is_active,
      sort_order: 0,
    })
    .select("*")
    .single();

  if (insertError || !data) {
    throw new Error(insertError?.message ?? "Could not create staff.");
  }

  await Promise.all([
    replaceWorkingHours(options.supabase, data.id, workingHours),
    replaceBreaks(options.supabase, data.id, breaks),
    replaceLeaves(options.supabase, data.id, leaves),
    replaceServices(options.supabase, data.id, serviceIds),
  ]);

  const assignable = await getAssignableServices(
    options.supabase,
    options.salonId,
  );

  return mapStaffRow(data as StaffRow, {
    workingHours,
    breaks,
    leaves,
    services: assignable.filter((s) => serviceIds.includes(s.id)),
  });
}

export {
  replaceWorkingHours,
  replaceBreaks,
  replaceLeaves,
  replaceServices,
};
