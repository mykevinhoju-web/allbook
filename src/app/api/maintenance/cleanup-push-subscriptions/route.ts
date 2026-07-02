import { NextResponse } from "next/server";

import { createServiceSupabase } from "@/lib/admin/tenant-context";

const DEFAULT_RETENTION_DAYS = 90;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Number(daysParam) : DEFAULT_RETENTION_DAYS;

  if (!Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ error: "Invalid days parameter." }, { status: 400 });
  }

  const isVercelCron = request.headers.has("x-vercel-cron");
  const manualToken = url.searchParams.get("token");
  const expectedToken = process.env.MAINTENANCE_TOKEN;

  const authorized =
    isVercelCron || (expectedToken && manualToken && manualToken === expectedToken);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabase
    .from("push_subscriptions")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    deleted: count ?? null,
    retentionDays: days,
    cutoff,
  });
}

