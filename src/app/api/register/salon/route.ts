import { NextResponse } from "next/server";

import { createSalonRegistration } from "@/features/salon-registration";
import type { CreateSalonRegistrationInput } from "@/features/salon-registration";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSalonRegistrationInput;

    if (!body?.method || (body.method !== "google" && body.method !== "manual")) {
      return NextResponse.json(
        { error: "Invalid registration method." },
        { status: 400 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await createSalonRegistration(supabase, body);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create salon.";
    const status = /required|choose|valid|match|accept|unknown|already/i.test(
      message,
    )
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
