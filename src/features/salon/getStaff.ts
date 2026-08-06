import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { SalonStaffMember } from "@/types/salon";

type AnySupabase = SupabaseClient<Database>;

type StaffRow = {
  id: string;
  name: string;
  position: string | null;
  role: string | null;
  photo_url: string | null;
  years_experience: number | null;
  languages: string[] | null;
  specialties: string[] | null;
  salon_staff_services?: Array<{
    service_id: string;
    salon_services?: { name: string } | null;
  }> | null;
};

function mapStaff(row: StaffRow): SalonStaffMember {
  const role = (row.role || row.position || "Stylist").trim();
  const availableServices = (row.salon_staff_services ?? [])
    .map((link) => link.salon_services?.name?.trim())
    .filter((name): name is string => Boolean(name));

  return {
    id: row.id,
    name: row.name,
    position: role,
    role,
    photoUrl: row.photo_url,
    yearsExperience: row.years_experience ?? 0,
    languages: row.languages ?? [],
    specialties: row.specialties ?? [],
    availableServices:
      availableServices.length > 0
        ? availableServices
        : (row.specialties ?? []),
  };
}

/**
 * Load active salon staff + assigned services from Supabase.
 */
export async function getStaff(
  supabase: AnySupabase,
  salonId: string,
): Promise<{ staff: SalonStaffMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from("salon_staff")
    .select(
      `
      id,
      name,
      position,
      role,
      photo_url,
      years_experience,
      languages,
      specialties,
      salon_staff_services (
        service_id,
        salon_services ( name )
      )
    `,
    )
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    const fallback = await supabase
      .from("salon_staff")
      .select(
        "id, name, position, role, photo_url, years_experience, languages, specialties",
      )
      .eq("salon_id", salonId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (fallback.error) {
      return { staff: [], error: fallback.error.message };
    }

    return {
      staff: ((fallback.data ?? []) as unknown as StaffRow[]).map(mapStaff),
      error: null,
    };
  }

  return {
    staff: ((data ?? []) as unknown as StaffRow[]).map(mapStaff),
    error: null,
  };
}
