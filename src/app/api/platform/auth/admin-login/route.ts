import { NextResponse } from "next/server";

import {
  ensureUserProfile,
  isPlatformAdminUser,
} from "@/features/platform/server/profiles";
import { createClient } from "@/lib/supabase/server";

/**
 * AllBook Admin login via Supabase Auth (email + password).
 * Only profiles.role = 'admin' may continue to /platform.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message ?? "Invalid email or password." },
        { status: 401 },
      );
    }

    const profile = await ensureUserProfile({
      userId: data.user.id,
      email: data.user.email ?? email,
      fullName:
        typeof data.user.user_metadata?.full_name === "string"
          ? data.user.user_metadata.full_name
          : null,
    });

    if (profile.role !== "admin") {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error:
            "Access denied. This account is not an AllBook Admin. Only profiles with role admin can sign in here.",
        },
        { status: 403 },
      );
    }

    const ok = await isPlatformAdminUser(data.user.id);
    if (!ok) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, redirectTo: "/platform" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sign in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
