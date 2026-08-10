import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { enrichSalonServices, type EnrichSalonResult } from "./enrich-salon";

type AnySupabase = SupabaseClient<Database>;

export type ServiceEnrichBatchResult = {
  processed: number;
  remainingEstimate: number;
  done: boolean;
  totals: {
    tagsApplied: number;
    servicesInserted: number;
    skipped: number;
    failed: number;
  };
  items: EnrichSalonResult[];
};

/**
 * Enrich next N hair/barber salons missing services_enriched_at.
 */
export async function runServiceEnrichmentBatch(
  supabase: AnySupabase,
  input: { batchSize?: number } = {},
): Promise<ServiceEnrichBatchResult> {
  const batchSize = Math.min(20, Math.max(1, input.batchSize ?? 5));

  const { data: rows, error } = await supabase
    .from("salons")
    .select("id")
    .eq("marketplace_visible", true)
    .eq("permanently_closed", false)
    .in("primary_service", ["Hair", "Barber"])
    .is("services_enriched_at", null)
    .order("review_count", { ascending: false })
    .limit(batchSize);

  if (error) {
    throw new Error(error.message);
  }

  const items: EnrichSalonResult[] = [];
  const totals = {
    tagsApplied: 0,
    servicesInserted: 0,
    skipped: 0,
    failed: 0,
  };

  for (const row of rows ?? []) {
    const result = await enrichSalonServices(supabase, row.id);
    items.push(result);
    totals.tagsApplied += result.tagsApplied;
    totals.servicesInserted += result.servicesInserted;
    if (result.status === "skipped") totals.skipped += 1;
    if (result.status === "failed") totals.failed += 1;
  }

  const { count } = await supabase
    .from("salons")
    .select("id", { count: "exact", head: true })
    .eq("marketplace_visible", true)
    .eq("permanently_closed", false)
    .in("primary_service", ["Hair", "Barber"])
    .is("services_enriched_at", null);

  const remainingEstimate = count ?? 0;

  return {
    processed: items.length,
    remainingEstimate,
    done: remainingEstimate === 0,
    totals,
    items,
  };
}
