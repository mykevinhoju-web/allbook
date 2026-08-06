import { NextResponse } from "next/server";

import { NO_PREFERENCE_STAFF_ID } from "@/features/salon-booking/catalog-types";
import { generateAvailableSlots } from "@/features/salon-booking/generateAvailableSlots";
import { getBookingSalonContext } from "@/features/salon-booking/getBookingSalonContext";
import { createSupabaseSalonBookingsRepository } from "@/features/salon-booking/repositories/supabase";
import type { ExistingBookingBlock } from "@/features/salon-booking/types";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** GET available slots + existing bookings for a date */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salonId");
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const staffId = searchParams.get("staffId");

  if (!salonId || !date || !serviceId) {
    return NextResponse.json(
      { error: "salonId, date, and serviceId are required." },
      { status: 400 },
    );
  }

  const service = createServiceSupabase();

  const { data: salon } = await service
    .from("salons")
    .select("slug")
    .eq("id", salonId)
    .maybeSingle();

  if (!salon?.slug) {
    return NextResponse.json({ error: "Salon not found." }, { status: 404 });
  }

  const { context, error } = await getBookingSalonContext(service, salon.slug);
  if (error || !context) {
    return NextResponse.json(
      { error: error || "Salon not found." },
      { status: 404 },
    );
  }

  const catalogService = context.services.find((s) => s.id === serviceId);
  if (!catalogService) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  const repo = createSupabaseSalonBookingsRepository(service);
  const candidates =
    staffId && staffId !== NO_PREFERENCE_STAFF_ID
      ? context.staff.filter((s) => s.id === staffId)
      : context.staff.filter(
          (s) => s.bookingEnabled && s.serviceIds.includes(serviceId),
        );

  const existingBookingsByStaff: Record<string, ExistingBookingBlock[]> = {};

  await Promise.all(
    candidates.map(async (member) => {
      const rows = await repo.listStaffBookingsForDate({
        salonId,
        staffId: member.id,
        bookingDate: date,
      });
      existingBookingsByStaff[member.id] = rows.map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
        bufferMinutes: b.bufferMinutes,
        status: b.status,
      }));
    }),
  );

  const slots = generateAvailableSlots({
    context,
    staffId,
    serviceId,
    serviceDuration: catalogService.duration,
    date,
    existingBookingsByStaff,
  });

  return NextResponse.json({ slots, existingBookingsByStaff });
}
