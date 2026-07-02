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
  [key: string]: string | string[] | number | boolean | null | undefined;
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
