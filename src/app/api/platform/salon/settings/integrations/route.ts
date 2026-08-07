import { NextResponse } from "next/server";

import { listIntegrationSlots } from "@/features/business-settings";
import { requireOwnerSalon } from "@/features/dashboard/getOwnerSalon";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const owner = await requireOwnerSalon("/platform/salon/settings");
    const supabase = createServiceSupabase();
    const integrations = await listIntegrationSlots(supabase, owner.salon.id);
    return NextResponse.json({ integrations });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load integrations.",
      },
      { status: 400 },
    );
  }
}
