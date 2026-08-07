import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import type { BusinessEventAction } from "./types";

type AnySupabase = SupabaseClient<Database>;

export async function recordBusinessEvent(
  supabase: AnySupabase,
  input: {
    salonId?: string | null;
    relatedSalonId?: string | null;
    placeId?: string | null;
    action: BusinessEventAction;
    actor?: string | null;
    details?: Record<string, unknown>;
  },
) {
  await supabase.from("marketplace_business_events").insert({
    salon_id: input.salonId ?? null,
    related_salon_id: input.relatedSalonId ?? null,
    place_id: input.placeId ?? null,
    action: input.action,
    actor: input.actor ?? "system",
    details: (input.details ?? {}) as Json,
  });
}
