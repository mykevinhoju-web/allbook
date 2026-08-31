import { NextResponse } from "next/server";

import { listActiveEverServices } from "@/features/ever/server/ever-data";
import {
  requireTenantFromRequest,
  TenantContextError,
} from "@/lib/admin/tenant-context";

export async function GET(request: Request) {
  try {
    const tenant = await requireTenantFromRequest(request);
    const services = await listActiveEverServices(tenant.id);

    return NextResponse.json({
      services,
      currency: tenant.settings.currency,
      timezone: tenant.settings.timezone,
    });
  } catch (error) {
    if (error instanceof TenantContextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
