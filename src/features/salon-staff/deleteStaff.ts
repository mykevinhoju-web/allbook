import type { SalonStaffMember } from "./types";

export async function deleteStaff(
  staff: SalonStaffMember[],
  staffId: string,
): Promise<SalonStaffMember[]> {
  return staff.filter((s) => s.id !== staffId);
}

export async function deleteStaffMany(
  staff: SalonStaffMember[],
  staffIds: string[],
): Promise<SalonStaffMember[]> {
  const remove = new Set(staffIds);
  return staff.filter((s) => !remove.has(s.id));
}
