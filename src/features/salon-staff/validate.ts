import type { StaffInput } from "./types";
import { STAFF_ROLES } from "./constants";

export function validateStaffInput(input: Partial<StaffInput>): string | null {
  if (!input.firstName?.trim()) return "First name is required.";
  if (!input.lastName?.trim()) return "Last name is required.";
  if (!input.role || !STAFF_ROLES.includes(input.role)) {
    return "Choose a valid role.";
  }
  if (
    input.bufferMinutes != null &&
    (Number.isNaN(input.bufferMinutes) || input.bufferMinutes < 0)
  ) {
    return "Buffer time must be 0 or more minutes.";
  }
  return null;
}
