import { NextResponse } from "next/server";

import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { createStaff } from "@/features/salon-staff/createStaff";
import type { StaffInput } from "@/features/salon-staff/types";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      salonId?: string;
      input?: StaffInput;
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
    const staff = await createStaff({
      supabase,
      salonId: body.salonId,
      input: body.input,
    });

    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create staff.",
      },
      { status: 400 },
    );
  }
}
