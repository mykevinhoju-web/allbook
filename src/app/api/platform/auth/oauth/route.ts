import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type OAuthProvider = "google" | "facebook";

function isOAuthProvider(value: string): value is OAuthProvider {
  return value === "google" || value === "facebook";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      provider?: string;
      next?: string;
    };

    const provider = body.provider ?? "";
    if (!isOAuthProvider(provider)) {
      return NextResponse.json(
        { error: "Supported providers: google, facebook." },
        { status: 400 },
      );
    }

    const origin = new URL(request.url).origin;
    const next = body.next?.startsWith("/") ? body.next : "/auth/continue";
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        {
          error:
            error?.message ??
            "Social login is not configured yet. Use email signup, or enable the provider in Supabase Auth.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start social login.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
