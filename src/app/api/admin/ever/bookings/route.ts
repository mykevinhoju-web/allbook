import { NextResponse } from "next/server";

import type { EverBookingStatus } from "@/features/ever/types";
import {
  listEverSiteBookings,
  updateEverSiteBookingStatus,
} from "@/features/ever/server/ever-data";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const bookings = await listEverSiteBookings(tenant.id);
    return NextResponse.json({
      bookings,
      timezone: tenant.settings.timezone,
    });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PATCH(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const body = (await request.json()) as {
      id?: string;
      status?: EverBookingStatus;
    };

    if (!body.id || !body.status) {
      return NextResponse.json(
        { error: "Booking id and status are required." },
        { status: 400 },
      );
    }

    if (!["pending", "confirmed", "cancelled"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const booking = await updateEverSiteBookingStatus(
      tenant.id,
      body.id,
      body.status,
    );

    return NextResponse.json({ booking });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
