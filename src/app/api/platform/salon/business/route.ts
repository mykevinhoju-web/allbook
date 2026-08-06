import { NextResponse } from "next/server";

import {
  updateBusiness,
  type BusinessProfileInput,
} from "@/features/business";
import { ownerOwnsSalon } from "@/features/dashboard/getOwnerSalon";
import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      salonId?: string;
      input?: BusinessProfileInput;
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
    const result = await updateBusiness(supabase, body.salonId, body.input);

    if (result.error || !result.business) {
      return NextResponse.json(
        { error: result.error || "Update failed." },
        { status: 400 },
      );
    }

    return NextResponse.json({ business: result.business });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update business.",
      },
      { status: 500 },
    );
  }
}
