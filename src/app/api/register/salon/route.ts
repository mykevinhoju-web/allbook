import { NextResponse } from "next/server";

import { createSalonRegistration } from "@/features/salon-registration";
import type { CreateSalonRegistrationInput } from "@/features/salon-registration";
import { createClient } from "@/lib/supabase/server";
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

    if (!body.owner?.ownerEmail || !body.owner?.password) {
      return NextResponse.json(
        { error: "Owner email and password are required." },
        { status: 400 },
      );
    }

    const sessionClient = await createClient();
    const {
      data: { user: existingUser },
    } = await sessionClient.auth.getUser();

    // Never trust client-supplied authUserId — bind ownership to the session only.
    if (body.authUserId && existingUser && body.authUserId !== existingUser.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (body.authUserId && !existingUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const service = createServiceSupabase();
    const result = await createSalonRegistration(service, {
      ...body,
      authUserId: existingUser?.id,
    });

    // Claimants can sign in to finish business-control verification; owner dashboard stays gated.
    if (!result.canLogin) {
      return NextResponse.json(result, { status: 201 });
    }

    if (existingUser?.id !== result.authUserId) {
      const { error: signInError } = await sessionClient.auth.signInWithPassword({
        email: body.owner.ownerEmail.trim().toLowerCase(),
        password: body.owner.password,
      });
      if (signInError) {
        return NextResponse.json(
          {
            ...result,
            error: "Salon created, but automatic sign-in failed. Please log in.",
            loginRequired: true,
          },
          { status: 201 },
        );
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create salon.";
    const status = /required|choose|valid|match|accept|unknown|already|owns/i.test(
      message,
    )
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
