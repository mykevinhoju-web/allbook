import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { archiveStaff } from "./updateStaff";
import type { SalonStaffMember } from "./types";

type AnySupabase = SupabaseClient<Database>;

/**
 * Soft-delete: archive the staff member (status = archived).
 */
export async function deleteStaff(
  supabase: AnySupabase,
  staff: SalonStaffMember[],
  staffId: string,
): Promise<SalonStaffMember[]> {
  const target = staff.find((s) => s.id === staffId);
  if (!target) return staff;
  const archived = await archiveStaff(supabase, target);
  return staff.map((s) => (s.id === archived.id ? archived : s));
}

export async function deleteStaffMany(
  supabase: AnySupabase,
  staff: SalonStaffMember[],
  staffIds: string[],
): Promise<SalonStaffMember[]> {
  const next = [...staff];
  for (const id of staffIds) {
    const idx = next.findIndex((s) => s.id === id);
    if (idx < 0) continue;
    const archived = await archiveStaff(supabase, next[idx]!);
    next[idx] = archived;
  }
  return next;
}
