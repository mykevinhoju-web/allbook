import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";

/**
 * Passwordless login: send a magic link to the owner's email.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    }

    const service = createServiceSupabase();
    const { data: profile } = await service
      .from("platform_owner_profiles")
      .select("auth_user_id")
      .eq("email", email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No account found for this email. Start a free trial to create one.",
        },
        { status: 404 },
      );
    }

    const origin = new URL(request.url).origin;
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/auth/continue`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email for a sign-in link.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not send login link.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
