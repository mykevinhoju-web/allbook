import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/** Max staff assigned to one booking (primary + one join). */
export const MAX_BOOKING_STAFF = 2;

export async function ensurePrimaryBookingStaff(
  supabase: SupabaseClient<Database>,
  args: {
    tenantId: string;
    bookingId: string;
    staffId: string;
  },
): Promise<void> {
  const { error } = await supabase.from("booking_staffs").upsert(
    {
      tenant_id: args.tenantId,
      booking_id: args.bookingId,
      staff_id: args.staffId,
      is_primary: true,
    },
    { onConflict: "booking_id,staff_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function listBookingStaff(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  bookingId: string,
): Promise<{ id: string; name: string; isPrimary: boolean }[]> {
  const { data, error } = await supabase
    .from("booking_staffs")
    .select("staff_id, is_primary, staff(name)")
    .eq("tenant_id", tenantId)
    .eq("booking_id", bookingId)
    .order("is_primary", { ascending: false });

  if (error || !data) return [];

  type StaffJoinRow = {
    staff_id: string;
    is_primary: boolean;
    staff?: { name: string } | { name: string }[] | null;
  };

  return (data as StaffJoinRow[]).map((row) => {
    const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;
    return {
      id: row.staff_id,
      name: staff?.name ?? "Staff",
      isPrimary: Boolean(row.is_primary),
    };
  });
}

export async function listBookingIdsForStaff(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  staffId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("booking_staffs")
    .select("booking_id")
    .eq("tenant_id", tenantId)
    .eq("staff_id", staffId);

  if (error || !data) return [];
  return (data as { booking_id: string }[]).map((row) => row.booking_id);
}

export async function countBookingStaff(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  bookingId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("booking_staffs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("booking_id", bookingId);

  if (error) return 0;
  return count ?? 0;
}
