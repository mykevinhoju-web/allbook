import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { AmenityId } from "@/types/salon";

import { collectSalonEvidenceText } from "./collect-evidence";
import { extractAmenitiesAndKeywords } from "./extract-amenities-keywords";
import {
  extractServicesFromText,
  mergeServiceDrafts,
  type ExtractedServiceDraft,
} from "./extract-from-text";
import { mapGoogleCategoriesToServiceTags } from "./google-category-tags";
import { extractServicesWithLlm } from "./llm-extract";

type AnySupabase = SupabaseClient<Database>;

export type EnrichSalonResult = {
  salonId: string;
  name: string;
  tagsApplied: number;
  servicesInserted: number;
  amenitiesApplied: number;
  keywordsApplied: number;
  sources: string[];
  status: "ok" | "skipped" | "failed";
  error?: string;
};

type SalonEnrichRow = {
  id: string;
  name: string;
  website: string | null;
  google_place_id: string | null;
  google_categories: string[] | null;
  primary_service: string | null;
  service_tags: string[] | null;
  amenities: string[] | null;
  search_keywords: string[] | null;
  claimed: boolean;
  services_enriched_at: string | null;
};

async function applyServiceTags(
  supabase: AnySupabase,
  salon: SalonEnrichRow,
): Promise<number> {
  const tags = mapGoogleCategoriesToServiceTags(
    salon.google_categories,
    salon.primary_service,
  );
  if (tags.length === 0) return 0;

  const existing = new Set(salon.service_tags ?? []);
  const merged = [...new Set([...existing, ...tags])];
  if (
    merged.length === existing.size &&
    merged.every((t) => existing.has(t))
  ) {
    return 0;
  }

  const { error } = await supabase
    .from("salons")
    .update({
      service_tags: merged,
      service_tags_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", salon.id);

  if (error) throw new Error(error.message);
  salon.service_tags = merged;
  return merged.length;
}

async function applyAmenitiesAndKeywords(
  supabase: AnySupabase,
  salon: SalonEnrichRow,
  evidenceText: string,
): Promise<{ amenitiesApplied: number; keywordsApplied: number }> {
  const extracted = extractAmenitiesAndKeywords(evidenceText, {
    name: salon.name,
    serviceTags: salon.service_tags,
  });

  const amenities = [
    ...new Set([
      ...(salon.amenities ?? []).filter(Boolean),
      ...extracted.amenities,
    ]),
  ] as AmenityId[];
  const keywords = [
    ...new Set([
      ...(salon.search_keywords ?? []).filter(Boolean),
      ...extracted.keywords,
    ]),
  ];

  const amenitiesChanged =
    amenities.length !== (salon.amenities ?? []).length ||
    amenities.some((a) => !(salon.amenities ?? []).includes(a));
  const keywordsChanged =
    keywords.length !== (salon.search_keywords ?? []).length ||
    keywords.some((k) => !(salon.search_keywords ?? []).includes(k));

  if (!amenitiesChanged && !keywordsChanged) {
    return { amenitiesApplied: 0, keywordsApplied: 0 };
  }

  const { error } = await supabase
    .from("salons")
    .update({
      amenities,
      search_keywords: keywords,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", salon.id);
  if (error) throw new Error(error.message);

  return {
    amenitiesApplied: amenitiesChanged ? amenities.length : 0,
    keywordsApplied: keywordsChanged ? keywords.length : 0,
  };
}

async function insertServiceDrafts(
  supabase: AnySupabase,
  salonId: string,
  drafts: ExtractedServiceDraft[],
): Promise<number> {
  if (drafts.length === 0) return 0;

  const { data: existing } = await supabase
    .from("salon_services")
    .select("name")
    .eq("salon_id", salonId);
  const existingNames = new Set(
    (existing ?? []).map((r) => r.name.trim().toLowerCase()),
  );

  const rows = drafts
    .filter((d) => !existingNames.has(d.name.toLowerCase()))
    .map((d, index) => ({
      salon_id: salonId,
      category: d.category,
      name: d.name,
      description:
        "Auto-detected draft from public listing text. Confirm prices before enabling booking.",
      duration_minutes: d.durationMinutes,
      price: d.priceFrom,
      price_type: "from" as const,
      booking_enabled: false,
      featured: false,
      status: "inactive" as const,
      is_active: false,
      sort_order: index,
    }));

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("salon_services").insert(rows);
  if (error) throw new Error(error.message);
  return rows.length;
}

/**
 * Step 1+2 for one salon: Google tags + text/LLM service drafts + amenities/keywords.
 */
export async function enrichSalonServices(
  supabase: AnySupabase,
  salonId: string,
): Promise<EnrichSalonResult> {
  const { data, error } = await supabase
    .from("salons")
    .select(
      "id, name, website, google_place_id, google_categories, primary_service, service_tags, amenities, search_keywords, claimed, services_enriched_at",
    )
    .eq("id", salonId)
    .maybeSingle();

  if (error || !data) {
    return {
      salonId,
      name: "",
      tagsApplied: 0,
      servicesInserted: 0,
      amenitiesApplied: 0,
      keywordsApplied: 0,
      sources: [],
      status: "failed",
      error: error?.message ?? "Salon not found",
    };
  }

  const salon = data as unknown as SalonEnrichRow;

  try {
    const tagsApplied = await applyServiceTags(supabase, salon);

    const { count: serviceCount } = await supabase
      .from("salon_services")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id);

    const alreadyHasMenu = (serviceCount ?? 0) > 0;
    const evidence = await collectSalonEvidenceText({
      website: salon.website,
      googlePlaceId: salon.google_place_id,
    });

    const featureStats = await applyAmenitiesAndKeywords(
      supabase,
      salon,
      evidence.text || salon.name,
    );

    if (salon.claimed && alreadyHasMenu) {
      await supabase
        .from("salons")
        .update({
          services_enriched_at: new Date().toISOString(),
        } as never)
        .eq("id", salon.id);
      return {
        salonId: salon.id,
        name: salon.name,
        tagsApplied,
        servicesInserted: 0,
        amenitiesApplied: featureStats.amenitiesApplied,
        keywordsApplied: featureStats.keywordsApplied,
        sources: evidence.sources,
        status: "skipped",
      };
    }

    const ruleDrafts = extractServicesFromText(
      evidence.text,
      salon.primary_service,
    );
    let llmDrafts: ExtractedServiceDraft[] = [];
    try {
      llmDrafts = await extractServicesWithLlm(
        evidence.text,
        salon.primary_service,
      );
    } catch {
      llmDrafts = [];
    }

    const drafts = mergeServiceDrafts(ruleDrafts, llmDrafts);
    const servicesInserted = await insertServiceDrafts(
      supabase,
      salon.id,
      drafts,
    );

    await supabase
      .from("salons")
      .update({
        services_enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", salon.id);

    return {
      salonId: salon.id,
      name: salon.name,
      tagsApplied,
      servicesInserted,
      amenitiesApplied: featureStats.amenitiesApplied,
      keywordsApplied: featureStats.keywordsApplied,
      sources: evidence.sources,
      status: "ok",
    };
  } catch (err) {
    return {
      salonId: salon.id,
      name: salon.name,
      tagsApplied: 0,
      servicesInserted: 0,
      amenitiesApplied: 0,
      keywordsApplied: 0,
      sources: [],
      status: "failed",
      error: err instanceof Error ? err.message : "Enrichment failed",
    };
  }
}
