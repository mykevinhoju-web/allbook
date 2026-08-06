/**
 * Browser-side staff mutations (calls owner-authenticated APIs).
 */
import type { SalonStaffMember, StaffInput, StaffStatus } from "./types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

export type CreateStaffOptions = {
  salonId: string;
  input: StaffInput;
};

export async function createStaff(
  options: CreateStaffOptions,
): Promise<SalonStaffMember> {
  const response = await fetch("/api/platform/salon/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      salonId: options.salonId,
      input: options.input,
    }),
  });
  const data = await parseJson<{ staff: SalonStaffMember }>(response);
  return data.staff;
}

export async function updateStaff(
  member: SalonStaffMember,
  patch: Partial<StaffInput> & { status?: StaffStatus },
): Promise<SalonStaffMember> {
  const response = await fetch(`/api/platform/salon/staff/${member.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ salonId: member.salonId, patch }),
  });
  const data = await parseJson<{ staff: SalonStaffMember }>(response);
  return data.staff;
}

export async function duplicateStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  const response = await fetch(
    `/api/platform/salon/staff/${member.id}/duplicate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId: member.salonId }),
    },
  );
  const data = await parseJson<{ staff: SalonStaffMember }>(response);
  return data.staff;
}

export async function archiveStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(member, { status: "archived", bookingEnabled: false });
}

export async function restoreStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(member, { status: "active", bookingEnabled: true });
}

export async function activateStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(member, { status: "active" });
}

export async function deactivateStaff(
  member: SalonStaffMember,
): Promise<SalonStaffMember> {
  return updateStaff(member, { status: "inactive", bookingEnabled: false });
}

export async function deleteStaff(
  staff: SalonStaffMember[],
  staffId: string,
): Promise<SalonStaffMember[]> {
  const target = staff.find((s) => s.id === staffId);
  if (!target) return staff;
  const archived = await archiveStaff(target);
  return staff.map((s) => (s.id === archived.id ? archived : s));
}

export async function deleteStaffMany(
  staff: SalonStaffMember[],
  staffIds: string[],
): Promise<SalonStaffMember[]> {
  const next = [...staff];
  for (const id of staffIds) {
    const idx = next.findIndex((s) => s.id === id);
    if (idx < 0) continue;
    const archived = await archiveStaff(next[idx]!);
    next[idx] = archived;
  }
  return next;
}
