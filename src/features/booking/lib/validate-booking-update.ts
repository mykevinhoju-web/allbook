import { assignAvailableRoom } from "@/features/booking/lib/assign-room";
import { getBookingRoomChangeWindow } from "@/features/booking/lib/room-availability";
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
  /**
   * When set, room conflict checks use this window instead of full starts/ends.
   * Used for in-progress room moves (remaining occupancy only).
   */
  roomConflictStartsAtIso?: string;
  roomConflictEndsAtIso?: string;
}

export async function resolveBookingRoomId({
  supabase,
  tenantId,
  bookingId,
  startsAtIso,
  endsAtIso,
  requestedRoomId,
  existingRoomId,
  roomConflictStartsAtIso,
  roomConflictEndsAtIso,
}: ValidateBookingUpdateArgs): Promise<string | null> {
  const conflictStarts = roomConflictStartsAtIso ?? startsAtIso;
  const conflictEnds = roomConflictEndsAtIso ?? endsAtIso;

  if (requestedRoomId) return requestedRoomId;

  if (requestedRoomId === null) {
    return assignAvailableRoom(
      supabase,
      tenantId,
      conflictStarts,
      conflictEnds,
      bookingId,
    );
  }

  if (existingRoomId) {
    const busy = await hasRoomBookingConflict(
      supabase,
      tenantId,
      existingRoomId,
      conflictStarts,
      conflictEnds,
      bookingId,
    );
    if (!busy) return existingRoomId;
  }

  return assignAvailableRoom(
    supabase,
    tenantId,
    conflictStarts,
    conflictEnds,
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
    roomConflictStartsAtIso,
    roomConflictEndsAtIso,
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

  const conflictStarts = roomConflictStartsAtIso ?? startsAtIso;
  const conflictEnds = roomConflictEndsAtIso ?? endsAtIso;

  if (
    await hasRoomBookingConflict(
      supabase,
      tenantId,
      roomId,
      conflictStarts,
      conflictEnds,
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

export type RoomReassignmentResult =
  | {
      ok: true;
      roomId: string;
      /** When moving an in-progress booking, tighten starts_at to remaining window. */
      startsAtIso?: string;
      endsAtIso: string;
      durationMinutes?: number;
    }
  | { ok: false; status: number; error: string };

/**
 * Room-only reassignment for an existing booking.
 * Uses the remaining occupancy window when the booking is already in progress,
 * so a target room that is free from now until ends_at is allowed.
 */
export async function validateRoomReassignment(args: {
  supabase: Parameters<typeof assignAvailableRoom>[0];
  tenantId: string;
  bookingId: string;
  requestedRoomId: string;
  existingRoomId: string | null;
  startsAtIso: string;
  endsAtIso: string;
  status: string;
  at?: Date;
}): Promise<RoomReassignmentResult> {
  const {
    supabase,
    tenantId,
    bookingId,
    requestedRoomId,
    startsAtIso,
    endsAtIso,
    status,
    at = new Date(),
  } = args;

  if (status === "cancelled" || status === "completed") {
    return {
      ok: false,
      status: 400,
      error: "Completed or cancelled bookings cannot change room.",
    };
  }

  const window = getBookingRoomChangeWindow(startsAtIso, endsAtIso, at);
  if (!window) {
    return {
      ok: false,
      status: 400,
      error: "This booking has already ended.",
    };
  }

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

  if (requestedRoomId === args.existingRoomId) {
    return { ok: true, roomId: requestedRoomId, endsAtIso };
  }

  if (
    await hasRoomBookingConflict(
      supabase,
      tenantId,
      requestedRoomId,
      window.startsAt,
      window.endsAt,
      bookingId,
    )
  ) {
    return {
      ok: false,
      status: 409,
      error: window.remainingOnly
        ? "This room is already booked for the remaining time."
        : "This room is already booked for that time slot.",
    };
  }

  if (window.remainingOnly) {
    const durationMinutes = Math.max(
      1,
      Math.round(
        (new Date(window.endsAt).getTime() -
          new Date(window.startsAt).getTime()) /
          60_000,
      ),
    );

    return {
      ok: true,
      roomId: requestedRoomId,
      startsAtIso: window.startsAt,
      endsAtIso: window.endsAt,
      durationMinutes,
    };
  }

  return {
    ok: true,
    roomId: requestedRoomId,
    endsAtIso: window.endsAt,
  };
}
