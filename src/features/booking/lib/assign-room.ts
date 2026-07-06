import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function assignAvailableRoom(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  startsAt: string,
  endsAt: string,
  excludeBookingId?: string,
): Promise<string | null> {
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!rooms?.length) {
    return null;
  }

  const { data: overlapping } = await supabase
    .from("bookings")
    .select("id, room_id")
    .eq("tenant_id", tenantId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .not("room_id", "is", null)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt);

  const busyRoomIds = new Set(
    (overlapping ?? [])
      .filter((booking) => booking.id !== excludeBookingId)
      .map((booking) => booking.room_id)
      .filter(Boolean) as string[],
  );

  const available = rooms.find((room) => !busyRoomIds.has(room.id));
  return available?.id ?? null;
}
