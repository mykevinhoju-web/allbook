import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { Tenant } from "@/features/tenants/types";
import type { StaffStatus } from "@/features/staff/types";
import {
  getShiftWindowFromAttributes,
  parseStaffAttributes,
} from "@/features/staff/utils/attributes";
import {
  isStaffWorkingOnDate,
  parseDaySchedule,
} from "@/features/staff/utils/day-schedule";
import { parseShiftPlan } from "@/features/staff/utils/shift-plan";

import {
  DEFAULT_BOOKING_TIMEZONE,
  getSlotsInShiftWindow,
  isoToDatetimeLocal,
  resolveShiftContainingTime,
  todayDateInZone,
} from "./schedule-utils";

export class BookingTimeValidationError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "BookingTimeValidationError";
  }
}

/** Same rules as GET /api/booking/availability — keeps UI slots and server in sync. */
export async function assertStaffSlotIsBookable(
  supabase: SupabaseClient<Database>,
  tenant: Tenant,
  staffId: string,
  startsAtIso: string,
  durationMinutes: number,
  now = new Date(),
): Promise<void> {
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id, status, attributes, working_hours_start, working_hours_end")
    .eq("tenant_id", tenant.id)
    .eq("id", staffId)
    .maybeSingle();

  if (!staffRow || staffRow.status !== "active") {
    throw new BookingTimeValidationError("Staff is not available.", 400);
  }

  const timeZone = tenant.settings.timezone || DEFAULT_BOOKING_TIMEZONE;
  const today = todayDateInZone(timeZone, now);
  const attributes = parseStaffAttributes(staffRow.attributes as never);
  const daySchedule = parseDaySchedule(attributes.daySchedule);
  const shiftPlan = parseShiftPlan(attributes.shiftPlan);
  const configured = getShiftWindowFromAttributes(attributes);

  const shiftMatch = resolveShiftContainingTime(
    startsAtIso,
    durationMinutes,
    timeZone,
    configured,
    staffRow.working_hours_start,
    staffRow.working_hours_end,
    now,
    shiftPlan,
  );

  if (!shiftMatch) {
    throw new BookingTimeValidationError(
      "Selected time is outside this staff member's availability window.",
      400,
    );
  }

  const { shiftStartsAt, shiftEndsAt, anchorDate } = shiftMatch;
  const bookingDate = isoToDatetimeLocal(startsAtIso, timeZone).slice(0, 10);

  if (
    !isStaffWorkingOnDate(
      staffRow.status as StaffStatus,
      daySchedule,
      bookingDate,
      shiftPlan,
      timeZone,
    )
  ) {
    throw new BookingTimeValidationError(
      bookingDate === today
        ? "Staff is not working today."
        : "Staff is not working on this day.",
      400,
    );
  }

  const startsMs = new Date(startsAtIso).getTime();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("tenant_id", tenant.id)
    .eq("staff_id", staffId)
    .neq("status", "cancelled")
    .neq("status", "completed")
    .lt("starts_at", shiftEndsAt)
    .gt("ends_at", shiftStartsAt);

  const slots = getSlotsInShiftWindow(
    shiftStartsAt,
    shiftEndsAt,
    durationMinutes,
    (bookings ?? []).map((row) => ({
      startsAt: row.starts_at,
      endsAt: row.ends_at,
    })),
    {
      timeZone,
      now: bookingDate === today ? now : undefined,
      anchorDate,
    },
  );

  const allowed = slots.some(
    (slot) => new Date(slot.startsAt).getTime() === startsMs,
  );

  if (!allowed) {
    throw new BookingTimeValidationError(
      "This time slot is no longer available. Please choose another time.",
      409,
    );
  }
}
