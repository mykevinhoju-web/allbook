import { NextResponse } from "next/server";

import {
  createPartnerApplication,
  getPartnerByAuthUserId,
  PartnerAuthError,
  requireAuthUser,
} from "@/features/marketplace-partner";
import type { CreatePartnerInput } from "@/features/marketplace-partner";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** GET: current user's partner (includes PII for owner). */
export async function GET() {
  try {
    const user = await requireAuthUser();
    const supabase = createServiceSupabase();
    const partner = await getPartnerByAuthUserId(user.id, supabase);
    return NextResponse.json({ partner });
  } catch (error) {
    if (error instanceof PartnerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}

/** POST: apply as independent or business_linked partner. */
export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as CreatePartnerInput;
    const supabase = createServiceSupabase();
    const partner = await createPartnerApplication({
      supabase,
      authUserId: user.id,
      input: body,
    });
    return NextResponse.json({ partner }, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed." },
      { status: 400 },
    );
  }
}
