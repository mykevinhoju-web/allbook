import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function getServicePriceCents(
  supabase: SupabaseClient<Database>,
  tenantId: string,
  durationMinutes: number,
): Promise<number | null> {
  const { data } = await supabase
    .from("service_options")
    .select("price_cents")
    .eq("tenant_id", tenantId)
    .eq("duration_minutes", durationMinutes)
    .eq("is_active", true)
    .maybeSingle();

  return data?.price_cents ?? null;
}
