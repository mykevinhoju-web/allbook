import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth OAuth / magic-link callback.
 * Exchanges ?code= for a session, then routes to continue or complete profile.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/auth/continue";
  let safeNext = next.startsWith("/") ? next : "/auth/continue";
  // Old OAuth links pointed at /signup/complete; always bridge via continue first.
  if (safeNext.startsWith("/signup/complete")) {
    safeNext = "/auth/continue";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
      );
    }
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
