import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getStaffSessionCookieName, verifyStaffSession } from "@/lib/staff-session";
import {
  createServiceSupabase,
  requireTenantFromRequest,
} from "@/lib/admin/tenant-context";

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

  // Determine audience: staff subscriptions are tied to staff login session.
  let audience: "admin" | "staff" = "admin";
  let staffId: string | null = null;

  try {
    const tenant = await requireTenantFromRequest(request);
    const cookieStore = await cookies();
    const token = cookieStore.get(getStaffSessionCookieName())?.value;

    if (token) {
      const payload = await verifyStaffSession(token);
      if (payload && payload.role === "staff" && payload.tenantId === tenant.id) {
        audience = "staff";
        staffId = payload.staffId;
      }
    }
  } catch {
    // If tenant context/session can't be resolved, default to admin subscription.
  }

  const supabase = createServiceSupabase();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      tenant_slug: tenantSlug,
      endpoint,
      p256dh,
      auth,
      audience,
      staff_id: staffId,
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
