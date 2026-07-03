import { NextResponse } from "next/server";

import {
  CreateBookingError,
  createTenantBooking,
} from "@/features/booking/server/create-booking";
import {
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function POST(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const body = (await request.json()) as {
      staffId?: string;
      startsAt?: string;
      durationMinutes?: number;
      customerName?: string;
      customerPhone?: string;
      customerPostcode?: string;
      customerEmail?: string;
      notes?: string;
    };

    if (!body.staffId || !body.startsAt || !body.durationMinutes) {
      return NextResponse.json(
        { error: "staffId, startsAt, and durationMinutes are required." },
        { status: 400 },
      );
    }

    if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Customer name and phone are required." },
        { status: 400 },
      );
    }

    const booking = await createTenantBooking(tenant, {
      staffId: body.staffId,
      startsAt: body.startsAt,
      durationMinutes: body.durationMinutes,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerPostcode: body.customerPostcode,
      customerEmail: body.customerEmail,
      notes: body.notes,
      status: "confirmed",
    });

    return NextResponse.json({ booking });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof CreateBookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
