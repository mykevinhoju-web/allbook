import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import type { Database } from "@/types/database";

export async function POST(request: Request) {
  let body: {
    tenantSlug?: string;
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    userAgent?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenantSlug, endpoint, p256dh, auth, userAgent } = body;

  if (!tenantSlug || !endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      tenant_slug: tenantSlug,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: "Run supabase/setup.sql to create push_subscriptions table.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
