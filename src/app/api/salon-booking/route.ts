import { NextResponse } from "next/server";

import {
  createBooking,
  BookingConflictError,
  BookingValidationError,
} from "@/features/salon-booking/createBooking";
import { pickStaffForSlot } from "@/features/salon-booking/generateAvailableSlots";
import { getBookingSalonContext } from "@/features/salon-booking/getBookingSalonContext";
import { createSupabaseSalonBookingsRepository } from "@/features/salon-booking/repositories/supabase";
import { NO_PREFERENCE_STAFF_ID } from "@/features/salon-booking/catalog-types";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      salonId?: string;
      slug?: string;
      serviceId?: string;
      staffId?: string | null;
      bookingDate?: string;
      startTime?: string;
      customer?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        email?: string;
        notes?: string;
      };
    };

    if (
      !body.slug ||
      !body.serviceId ||
      !body.bookingDate ||
      !body.startTime ||
      !body.customer?.firstName ||
      !body.customer?.lastName
    ) {
      return NextResponse.json(
        { error: "Missing required booking fields." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const { context, error } = await getBookingSalonContext(
      supabase,
      body.slug,
    );
    if (error || !context) {
      return NextResponse.json(
        { error: error || "Salon not found." },
        { status: 404 },
      );
    }

    const service = context.services.find((s) => s.id === body.serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    const repo = createSupabaseSalonBookingsRepository(supabase);
    const candidates =
      body.staffId && body.staffId !== NO_PREFERENCE_STAFF_ID
        ? context.staff.filter((s) => s.id === body.staffId)
        : context.staff.filter(
            (s) =>
              s.bookingEnabled && s.serviceIds.includes(service.id),
          );

    const existingBookingsByStaff: Record<
      string,
      {
        startTime: string;
        endTime: string;
        bufferMinutes?: number;
        status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
      }[]
    > = {};

    await Promise.all(
      candidates.map(async (member) => {
        const rows = await repo.listStaffBookingsForDate({
          salonId: context.salonId,
          staffId: member.id,
          bookingDate: body.bookingDate!,
        });
        existingBookingsByStaff[member.id] = rows.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
          bufferMinutes: b.bufferMinutes,
          status: b.status,
        }));
      }),
    );

    const pick = pickStaffForSlot({
      context,
      staffId: body.staffId ?? NO_PREFERENCE_STAFF_ID,
      serviceId: service.id,
      serviceDuration: service.duration,
      date: body.bookingDate,
      startTime: body.startTime,
      existingBookingsByStaff,
    });

    if (!pick) {
      return NextResponse.json(
        { error: "Selected time is no longer available." },
        { status: 409 },
      );
    }

    const fullName =
      `${body.customer.firstName} ${body.customer.lastName}`.trim();

    const booking = await createBooking(repo, {
      salonId: context.salonId,
      staffId: pick.staff.id,
      serviceId: service.id,
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      duration: service.duration,
      bufferMinutes: pick.staff.bufferMinutes,
      customerName: fullName,
      customerEmail: body.customer.email ?? "",
      customerPhone: body.customer.phone ?? "",
      notes: body.customer.notes ?? "",
      status: "pending",
      availability: pick.availability,
    });

    return NextResponse.json({
      booking,
      staffName: pick.staff.displayName,
    });
  } catch (error) {
    if (
      error instanceof BookingConflictError ||
      error instanceof BookingValidationError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create booking.",
      },
      { status: 500 },
    );
  }
}
