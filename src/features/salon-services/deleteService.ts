import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { archiveService } from "./updateService";
import type { SalonService } from "./types";

type AnySupabase = SupabaseClient<Database>;

/**
 * Soft-delete: archive the service (status = archived).
 */
export async function deleteService(
  supabase: AnySupabase,
  service: SalonService,
): Promise<SalonService> {
  return archiveService(supabase, service);
}

export async function deleteServices(
  supabase: AnySupabase,
  services: SalonService[],
  serviceIds: string[],
): Promise<SalonService[]> {
  const targets = services.filter((s) => serviceIds.includes(s.id));
  const archived = await Promise.all(
    targets.map((s) => archiveService(supabase, s)),
  );
  const byId = new Map(archived.map((s) => [s.id, s]));
  return services.map((s) => byId.get(s.id) ?? s);
}
