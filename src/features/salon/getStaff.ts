import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { SalonStaffMember } from "@/types/salon";

type AnySupabase = SupabaseClient<Database>;

type StaffRow = {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
  years_experience: number;
  languages: string[] | null;
  specialties: string[] | null;
};

function mapStaff(row: StaffRow): SalonStaffMember {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    photoUrl: row.photo_url,
    yearsExperience: row.years_experience ?? 0,
    languages: row.languages ?? [],
    specialties: row.specialties ?? [],
  };
}

export async function getStaff(
  supabase: AnySupabase,
  salonId: string,
): Promise<{ staff: SalonStaffMember[]; error: string | null }> {
  const { data, error } = await supabase
    .from("salon_staff")
    .select(
      "id, name, position, photo_url, years_experience, languages, specialties",
    )
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return { staff: [], error: error.message };
  }

  return {
    staff: ((data ?? []) as StaffRow[]).map(mapStaff),
    error: null,
  };
}
