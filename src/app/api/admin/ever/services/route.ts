import { NextResponse } from "next/server";

import {
  listAllEverServices,
  upsertEverServices,
} from "@/features/ever/server/ever-data";
import {
  handleAdminRouteError,
  requireTenantAndAdminActor,
} from "@/lib/admin/require-admin-api";

export async function GET(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const services = await listAllEverServices(tenant.id);
    return NextResponse.json({ services, currency: tenant.settings.currency });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    throw error;
  }
}

export async function PUT(request: Request) {
  try {
    const { tenant } = await requireTenantAndAdminActor(request);
    const body = (await request.json()) as {
      services?: {
        id?: string;
        name?: string;
        durationMinutes?: number;
        priceCents?: number | null;
        sortOrder?: number;
        isActive?: boolean;
      }[];
    };

    if (!body.services?.length) {
      return NextResponse.json(
        { error: "At least one service is required." },
        { status: 400 },
      );
    }

    for (const service of body.services) {
      if (!service.name?.trim()) {
        return NextResponse.json(
          { error: "Each service needs a name." },
          { status: 400 },
        );
      }
      if (!service.durationMinutes || service.durationMinutes <= 0) {
        return NextResponse.json(
          { error: "Each service needs a valid duration." },
          { status: 400 },
        );
      }
    }

    const services = await upsertEverServices(
      tenant.id,
      body.services.map((service, index) => ({
        id: service.id,
        name: service.name!.trim(),
        durationMinutes: service.durationMinutes!,
        priceCents:
          service.priceCents === undefined || service.priceCents === null
            ? null
            : Math.max(0, service.priceCents),
        sortOrder: service.sortOrder ?? index + 1,
        isActive: service.isActive !== false,
      })),
    );

    return NextResponse.json({ services });
  } catch (error) {
    const guard = handleAdminRouteError(error);
    if (guard) return guard;
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
