import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import {
  hasRoomBookingConflict,
  hasStaffBookingConflict,
} from "@/features/booking/lib/staff-conflict";

export function isBookingOverlapConstraintError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  return (
    error.code === "23P01" ||
    error.message?.includes("bookings_staff_no_overlap") === true ||
    error.message?.includes("bookings_room_no_overlap") === true
  );
}

export function isRoomOverlapConstraintError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) return false;
  return error.message?.includes("bookings_room_no_overlap") === true;
}

interface ValidateBookingUpdateArgs {
  supabase: Parameters<typeof assignAvailableRoom>[0];
  tenantId: string;
  bookingId: string;
  staffId: string;
  startsAtIso: string;
  endsAtIso: string;
  requestedRoomId?: string | null;
  existingRoomId?: string | null;
}

export async function resolveBookingRoomId({
  supabase,
  tenantId,
  bookingId,
  startsAtIso,
  endsAtIso,
  requestedRoomId,
  existingRoomId,
}: ValidateBookingUpdateArgs): Promise<string | null> {
  if (requestedRoomId) return requestedRoomId;

  if (requestedRoomId === null) {
    return assignAvailableRoom(
      supabase,
      tenantId,
      startsAtIso,
      endsAtIso,
      bookingId,
    );
  }

  if (existingRoomId) {
    const busy = await hasRoomBookingConflict(
      supabase,
      tenantId,
      existingRoomId,
      startsAtIso,
      endsAtIso,
      bookingId,
    );
    if (!busy) return existingRoomId;
  }

  return assignAvailableRoom(
    supabase,
    tenantId,
    startsAtIso,
    endsAtIso,
    bookingId,
  );
}

export async function validateBookingUpdate(
  args: ValidateBookingUpdateArgs,
): Promise<
  | { ok: true; roomId: string }
  | { ok: false; status: number; error: string }
> {
  const {
    supabase,
    tenantId,
    bookingId,
    staffId,
    startsAtIso,
    endsAtIso,
    requestedRoomId,
  } = args;

  if (
    await hasStaffBookingConflict(
      supabase,
      tenantId,
      staffId,
      startsAtIso,
      endsAtIso,
      bookingId,
    )
  ) {
    return {
      ok: false,
      status: 409,
      error: "This staff member already has a booking in that time slot.",
    };
  }

  const roomId = await resolveBookingRoomId(args);

  if (!roomId) {
    return {
      ok: false,
      status: 409,
      error: "No treatment room available for this time slot.",
    };
  }

  if (requestedRoomId) {
    const { data: roomRow } = await supabase
      .from("rooms")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", requestedRoomId)
      .eq("is_active", true)
      .maybeSingle();

    if (!roomRow) {
      return {
        ok: false,
        status: 400,
        error: "Selected room is not available.",
      };
    }
  }

  if (
    await hasRoomBookingConflict(
      supabase,
      tenantId,
      roomId,
      startsAtIso,
      endsAtIso,
      bookingId,
    )
  ) {
    return {
      ok: false,
      status: 409,
      error: "This room is already booked for that time slot.",
    };
  }

  return { ok: true, roomId };
}
