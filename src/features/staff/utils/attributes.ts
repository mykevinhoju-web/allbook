import type { Json } from "@/types/database";

/** Extensible staff profile fields stored in staff.attributes JSONB. */
export interface StaffAttributes {
  age?: string;
  height?: string;
  weight?: string;
  languages?: string[];
  nationality?: string;
  experience?: string;
  introduction?: string;
  username?: string;
  /** ISO start of current availability window (may span midnight). */
  shiftStartsAt?: string;
  /** ISO end of current availability window. */
  shiftEndsAt?: string;
  /** Per-date overrides. false = day off. */
  daySchedule?: Record<string, boolean>;
  bookableSlots?: string[];
  [key: string]:
    | string
    | string[]
    | number
    | boolean
    | Record<string, boolean>
    | null
    | undefined;
}

export function parseStaffAttributes(value: Json | null): StaffAttributes {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as StaffAttributes;
}

export function toStaffAttributesJson(
  attributes: StaffAttributes,
): Record<string, Json> {
  return attributes as Record<string, Json>;
}

export function getShiftWindowFromAttributes(attributes: StaffAttributes): {
  shiftStartsAt: string | null;
  shiftEndsAt: string | null;
} {
  const shiftStartsAt =
    typeof attributes.shiftStartsAt === "string" && attributes.shiftStartsAt
      ? attributes.shiftStartsAt
      : null;
  const shiftEndsAt =
    typeof attributes.shiftEndsAt === "string" && attributes.shiftEndsAt
      ? attributes.shiftEndsAt
      : null;

  return { shiftStartsAt, shiftEndsAt };
}
