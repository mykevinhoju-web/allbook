import { NextResponse } from "next/server";

import { processGoogleSyncRunBatch } from "@/features/google-sync";
import {
  PlatformAuthError,
  requirePlatformAdmin,
} from "@/features/platform/server/require-platform-admin";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Process the next batch for a sync run (queue worker). */
export async function POST(request: Request) {
  try {
    const token = process.env.MAINTENANCE_TOKEN?.trim();
    const auth = request.headers.get("authorization") ?? "";
    const maintenanceOk = Boolean(token && auth === `Bearer ${token}`);
    if (!maintenanceOk) {
      await requirePlatformAdmin();
    }

    const body = (await request.json()) as {
      runId?: string;
      batchSize?: number;
      delayMs?: number;
    };

    if (!body.runId) {
      return NextResponse.json({ error: "runId is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const result = await processGoogleSyncRunBatch(supabase, body.runId, {
      batchSize: body.batchSize,
      delayMs: body.delayMs,
    });

    return NextResponse.json({
      run: result.run,
      batch: result.batch,
      done: result.done,
      label: result.done
        ? "Sync complete"
        : `Processed ${result.run.totals.processed} / ${result.run.totals.queued}`,
    });
  } catch (error) {
    if (error instanceof PlatformAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process sync batch.",
      },
      { status: 400 },
    );
  }
}
