import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

/** Form sentinel — not a real staff UUID. */
export const OTHER_STAFF_SENTINEL = "__other_staff__";

/** First option in the Other Staff list — unassigned until confirmed later. */
export const ANY_GIRL_SENTINEL = "__any_girl__";
export const ANY_GIRL_LABEL = "Any Girl";

export function isAnyGirlName(name?: string | null): boolean {
  return (name ?? "").trim().toLowerCase() === ANY_GIRL_LABEL.toLowerCase();
}

export const OTHER_STAFF_GUEST_ATTR = "otherStaffGuest";

const OTHER_STAFF_MARKER_RE = /\[other-staff:([^\]]+)\]/i;

export function isOtherStaffBooking(notes?: string | null): boolean {
  if (!notes) return false;
  return OTHER_STAFF_MARKER_RE.test(notes);
}

export function parseOtherStaffName(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(OTHER_STAFF_MARKER_RE);
  const name = match?.[1]?.trim();
  return name || null;
}

export function withOtherStaffNote(
  name: string,
  notes?: string | null,
): string {
  const cleanedName = name.trim().replace(/[\[\]]/g, "");
  const rest = stripOtherStaffNote(notes).trim();
  const marker = `[other-staff:${cleanedName}]`;
  return rest ? `${marker} ${rest}` : marker;
}

export function stripOtherStaffNote(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/\[other-staff:[^\]]*\]\s*/gi, "").trim();
}

export function isOtherStaffGuestAttributes(
  attributes: unknown,
): boolean {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return false;
  }
  return Boolean(
    (attributes as Record<string, unknown>)[OTHER_STAFF_GUEST_ATTR],
  );
}

/** Find or create a booking-only staff row for an external / other staff name. */
export async function ensureOtherStaffMember(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const cleaned = name.trim().replace(/[\[\]]/g, "");
  if (!cleaned) {
    throw new Error("Other staff name is required.");
  }

  const { data: existingRows, error: listError } = await supabase
    .from("staff")
    .select("id, name, attributes")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .ilike("name", cleaned)
    .limit(20);

  if (listError) {
    throw new Error(listError.message);
  }

  const match = (existingRows ?? []).find((row) =>
    isOtherStaffGuestAttributes(row.attributes),
  );
  if (match) {
    return { id: match.id, name: match.name };
  }

  const attributes = {
    [OTHER_STAFF_GUEST_ATTR]: true,
  } as Record<string, Json>;

  const { data, error } = await supabase
    .from("staff")
    .insert({
      tenant_id: tenantId,
      name: cleaned,
      status: "active",
      attributes,
      working_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      working_hours_start: "00:00",
      working_hours_end: "23:59",
      sort_order: 9_000,
    })
    .select("id, name")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create other staff.");
  }

  return { id: data.id, name: data.name };
}
