import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { createService } from "@/features/salon-services/createService";
import type { ServiceInput } from "@/features/salon-services/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      salonId?: string;
      input?: ServiceInput;
      existingCount?: number;
    };

    if (!body.salonId || !body.input) {
      return NextResponse.json(
        { error: "salonId and input are required." },
        { status: 400 },
      );
    }

    const session = await createClient();
    const {
      data: { user },
    } = await session.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const owns = await ownerOwnsSalon(user.id, body.salonId, session);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = createServiceSupabase();
    const service = await createService({
      supabase,
      salonId: body.salonId,
      input: body.input,
      existingCount: body.existingCount,
    });

    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create service.",
      },
      { status: 400 },
    );
  }
}
