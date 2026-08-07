import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import { countSalonsForSync, selectSalonsForSync } from "./select-salons";
import { syncWithThrottle } from "./sync-salon";
import {
  EMPTY_SYNC_TOTALS,
  type GoogleSyncItemResult,
  type GoogleSyncProgressEvent,
  type GoogleSyncRunSummary,
  type GoogleSyncSalonResult,
  type GoogleSyncTarget,
  type GoogleSyncTotals,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

type RunRow = Database["public"]["Tables"]["google_sync_runs"]["Row"];

function parseTotals(raw: Json | null | undefined): GoogleSyncTotals {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_SYNC_TOTALS };
  }
  const o = raw as Record<string, unknown>;
  return {
    updated: Number(o.updated ?? 0),
    unchanged: Number(o.unchanged ?? 0),
    failed: Number(o.failed ?? 0),
    closed: Number(o.closed ?? 0),
    missing: Number(o.missing ?? 0),
    processed: Number(o.processed ?? 0),
    queued: Number(o.queued ?? 0),
  };
}

function totalsToJson(totals: GoogleSyncTotals): Json {
  return { ...totals };
}

function mapRun(row: RunRow): GoogleSyncRunSummary {
  return {
    id: row.id,
    scope: row.scope,
    country: row.country,
    state: row.state,
    city: row.city,
    salonId: row.salon_id,
    status: row.status,
    triggeredBy: row.triggered_by,
    totals: parseTotals(row.totals),
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

function targetFromRun(row: RunRow): GoogleSyncTarget {
  return {
    scope: row.scope,
    country: row.country ?? undefined,
    state: row.state ?? undefined,
    city: row.city ?? undefined,
    salonId: row.salon_id ?? undefined,
  };
}

function bumpTotals(
  totals: GoogleSyncTotals,
  result: GoogleSyncItemResult,
): GoogleSyncTotals {
  const next = { ...totals, processed: totals.processed + 1 };
  if (result === "updated") next.updated += 1;
  else if (result === "unchanged") next.unchanged += 1;
  else if (result === "failed") next.failed += 1;
  else if (result === "closed") next.closed += 1;
  else if (result === "missing") next.missing += 1;
  return next;
}

export async function createGoogleSyncRun(
  supabase: AnySupabase,
  target: GoogleSyncTarget,
  triggeredBy: string,
): Promise<GoogleSyncRunSummary> {
  if (target.scope === "single" && !target.salonId) {
    throw new Error("salonId is required for single sync.");
  }
  if (
    (target.scope === "city" || target.scope === "scheduled") &&
    (!target.city || !target.state)
  ) {
    throw new Error("city and state are required for city/scheduled sync.");
  }
  if (target.scope === "state" && !target.state) {
    throw new Error("state is required for state sync.");
  }

  const queued = await countSalonsForSync(supabase, target);
  const totals: GoogleSyncTotals = { ...EMPTY_SYNC_TOTALS, queued };

  const { data, error } = await supabase
    .from("google_sync_runs")
    .insert({
      scope: target.scope,
      country: target.country ?? "Australia",
      state: target.state ?? null,
      city: target.city ?? null,
      salon_id: target.salonId ?? null,
      status: "queued",
      triggered_by: triggeredBy,
      totals: totalsToJson(totals),
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create sync run.");
  }

  return mapRun(data);
}

async function alreadyProcessedIds(
  supabase: AnySupabase,
  runId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("google_sync_run_items")
    .select("salon_id")
    .eq("run_id", runId);
  return (data ?? [])
    .map((r) => r.salon_id)
    .filter((id): id is string => Boolean(id));
}

async function persistItem(
  supabase: AnySupabase,
  runId: string,
  item: GoogleSyncSalonResult,
) {
  await supabase.from("google_sync_run_items").insert({
    run_id: runId,
    salon_id: item.salonId || null,
    place_id: item.placeId || null,
    business_name: item.businessName || null,
    result: item.result,
    changed_fields: item.changedFields,
    error: item.error ?? null,
  });
}

/**
 * Process the next batch for a queued/running sync run.
 * Returns progress so the admin UI can poll.
 */
export async function processGoogleSyncRunBatch(
  supabase: AnySupabase,
  runId: string,
  options?: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (event: GoogleSyncProgressEvent) => void;
  },
): Promise<{
  run: GoogleSyncRunSummary;
  batch: GoogleSyncSalonResult[];
  done: boolean;
}> {
  const batchSize = Math.min(50, Math.max(1, options?.batchSize ?? 10));
  const delayMs = options?.delayMs ?? 80;

  const { data: runRow, error: runError } = await supabase
    .from("google_sync_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();

  if (runError || !runRow) {
    throw new Error(runError?.message ?? "Sync run not found.");
  }

  if (runRow.status === "completed" || runRow.status === "failed") {
    return { run: mapRun(runRow), batch: [], done: true };
  }

  const now = new Date().toISOString();
  if (runRow.status === "queued") {
    await supabase
      .from("google_sync_runs")
      .update({ status: "running", started_at: now })
      .eq("id", runId);
    runRow.status = "running";
    runRow.started_at = now;
  }

  const excludeIds = await alreadyProcessedIds(supabase, runId);
  const target = targetFromRun(runRow);
  const salons = await selectSalonsForSync(supabase, target, {
    excludeIds,
    limit: batchSize,
  });

  let totals = parseTotals(runRow.totals);
  const batch: GoogleSyncSalonResult[] = [];

  for (const salon of salons) {
    const result = await syncWithThrottle(supabase, salon, delayMs);
    batch.push(result);
    await persistItem(supabase, runId, result);
    totals = bumpTotals(totals, result.result);

    options?.onProgress?.({
      runId,
      processed: totals.processed,
      queued: totals.queued,
      totals,
      label: `${result.businessName || result.placeId}: ${result.result}`,
      done: false,
    });
  }

  const done = salons.length < batchSize;
  const finishedAt = done ? new Date().toISOString() : null;

  const { data: updated, error: updateError } = await supabase
    .from("google_sync_runs")
    .update({
      status: done ? "completed" : "running",
      totals: totalsToJson(totals),
      finished_at: finishedAt,
    })
    .eq("id", runId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update sync run.");
  }

  const summary = mapRun(updated);
  options?.onProgress?.({
    runId,
    processed: summary.totals.processed,
    queued: summary.totals.queued,
    totals: summary.totals,
    label: done ? "Sync complete" : "Batch complete",
    done,
  });

  return { run: summary, batch, done };
}

/** Drain a run until complete (manual single / small city jobs). */
export async function processGoogleSyncRunToCompletion(
  supabase: AnySupabase,
  runId: string,
  options?: {
    batchSize?: number;
    delayMs?: number;
    onProgress?: (event: GoogleSyncProgressEvent) => void;
    maxBatches?: number;
  },
): Promise<GoogleSyncRunSummary> {
  const maxBatches = options?.maxBatches ?? 500;
  let last = await processGoogleSyncRunBatch(supabase, runId, options);
  let n = 1;
  while (!last.done && n < maxBatches) {
    last = await processGoogleSyncRunBatch(supabase, runId, options);
    n += 1;
  }
  return last.run;
}

export async function getGoogleSyncRun(
  supabase: AnySupabase,
  runId: string,
): Promise<{
  run: GoogleSyncRunSummary;
  items: Array<{
    id: string;
    salonId: string | null;
    placeId: string | null;
    businessName: string | null;
    result: GoogleSyncItemResult;
    changedFields: string[];
    error: string | null;
    createdAt: string;
  }>;
} | null> {
  const { data: runRow } = await supabase
    .from("google_sync_runs")
    .select("*")
    .eq("id", runId)
    .maybeSingle();
  if (!runRow) return null;

  const { data: items } = await supabase
    .from("google_sync_run_items")
    .select("*")
    .eq("run_id", runId)
    .order("created_at", { ascending: false })
    .limit(200);

  return {
    run: mapRun(runRow),
    items: (items ?? []).map((item) => ({
      id: item.id,
      salonId: item.salon_id,
      placeId: item.place_id,
      businessName: item.business_name,
      result: item.result,
      changedFields: item.changed_fields ?? [],
      error: item.error,
      createdAt: item.created_at,
    })),
  };
}

export async function listGoogleSyncHistory(
  supabase: AnySupabase,
  limit = 30,
): Promise<GoogleSyncRunSummary[]> {
  const { data } = await supabase
    .from("google_sync_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(mapRun);
}

/**
 * Enqueue + optionally drain a scheduled city sync.
 * Cron should call with maintenance token; Search Architecture unchanged.
 */
export async function runScheduledGoogleSync(
  supabase: AnySupabase,
  target: Omit<GoogleSyncTarget, "scope"> & {
    city: string;
    state: string;
  },
  options?: { processNow?: boolean; batchSize?: number },
): Promise<GoogleSyncRunSummary> {
  const run = await createGoogleSyncRun(
    supabase,
    {
      scope: "scheduled",
      country: target.country ?? "Australia",
      state: target.state,
      city: target.city,
    },
    "cron",
  );

  if (options?.processNow === false) return run;

  return processGoogleSyncRunToCompletion(supabase, run.id, {
    batchSize: options?.batchSize ?? 15,
  });
}
