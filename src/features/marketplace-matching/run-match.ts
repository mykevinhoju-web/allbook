import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import {
  matchPartners,
  normalizeCatalogPartner,
} from "./match-partners";
import type {
  MatchResult,
  MatchingPartner,
  StructuredServiceRequest,
} from "./types";

type Client = SupabaseClient<Database>;

export async function loadMatchingCatalog(
  supabase: Client,
): Promise<MatchingPartner[]> {
  const { data, error } = await supabase.rpc(
    "load_marketplace_matching_catalog",
  );
  if (error) throw new Error(error.message);
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) =>
    normalizeCatalogPartner(row as unknown as Record<string, unknown>),
  );
}

export async function resolveSuburb(
  supabase: Client,
  locationLabel: string,
): Promise<{ id: string; name: string; postcode: string | null } | null> {
  const { data, error } = await supabase.rpc("resolve_suburb_by_name", {
    p_name: locationLabel,
  });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const r = row as { id: string; name: string; postcode: string | null };
  return { id: r.id, name: r.name, postcode: r.postcode };
}

export async function runMarketplaceMatch(args: {
  supabase: Client;
  request: StructuredServiceRequest;
  persist?: boolean;
  isDemo?: boolean;
}): Promise<MatchResult & { requestId: string | null }> {
  const suburb =
    args.request.suburbId != null
      ? {
          id: args.request.suburbId,
          name: args.request.locationLabel,
          postcode: null as string | null,
        }
      : await resolveSuburb(args.supabase, args.request.locationLabel);

  const request: StructuredServiceRequest = {
    ...args.request,
    suburbId: suburb?.id ?? args.request.suburbId ?? null,
  };

  // If suburb resolved via name, postcode comes from RPC.
  const suburbPostcode = suburb?.postcode ?? null;

  const partners = await loadMatchingCatalog(args.supabase);
  const result = matchPartners({
    request,
    partners,
    suburbPostcode,
  });

  if (!args.persist) {
    return { ...result, requestId: null };
  }

  const { data: reqRow, error: reqError } = await args.supabase
    .from("service_requests")
    .insert({
      raw_query: request.rawQuery ?? null,
      structured: request as unknown as Json,
      service_category: request.serviceCategory,
      service_slug: request.serviceSlug,
      location_label: request.locationLabel,
      suburb_id: request.suburbId ?? null,
      preferred_date: request.preferredDate ?? null,
      preferred_time: request.preferredTime,
      budget_cents_max: request.budgetCentsMax,
      urgency: request.urgency ?? "normal",
      status: result.matches.length ? "matched" : "open",
      is_demo: args.isDemo ?? true,
    })
    .select("id")
    .single();

  if (reqError) throw new Error(reqError.message);
  const requestId = reqRow.id;

  const matchRows = [
    ...result.matches.map((m) => ({
      request_id: requestId,
      partner_id: m.partner.id,
      partner_service_id: m.service.id,
      score: m.score,
      score_breakdown: m.scoreBreakdown as unknown as Json,
      status: "suggested" as const,
      exclusion_reason: null as string | null,
      quoted_price_cents: m.service.priceCents,
      is_demo: args.isDemo ?? true,
    })),
    // Optionally persist exclusions for demo debugging (top-level excluded only)
    ...result.excluded.map((e) => ({
      request_id: requestId,
      partner_id: e.partner.id,
      partner_service_id: e.service?.id ?? null,
      score: 0,
      score_breakdown: e.scoreBreakdown as unknown as Json,
      status: "expired" as const,
      exclusion_reason: e.exclusionReason,
      quoted_price_cents: e.service?.priceCents ?? null,
      is_demo: args.isDemo ?? true,
    })),
  ];

  // Unique (request_id, partner_id) — keep best match per partner, drop duplicate exclusions
  const byPartner = new Map<string, (typeof matchRows)[number]>();
  for (const row of matchRows) {
    const existing = byPartner.get(row.partner_id);
    if (!existing) {
      byPartner.set(row.partner_id, row);
      continue;
    }
    // Prefer suggested over expired
    if (existing.status === "expired" && row.status === "suggested") {
      byPartner.set(row.partner_id, row);
    }
  }

  const { error: matchError } = await args.supabase
    .from("request_matches")
    .insert([...byPartner.values()]);
  if (matchError) throw new Error(matchError.message);

  return { ...result, requestId };
}
