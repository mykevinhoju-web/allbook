import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { SalonServiceGroup, SalonServiceItem } from "@/types/salon";

import { SALON_SERVICE_CATEGORY_ORDER } from "./constants";

type AnySupabase = SupabaseClient<Database>;

type ServiceRow = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  sort_order: number;
};

function mapService(row: ServiceRow): SalonServiceItem {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    durationMinutes: row.duration_minutes,
    price: row.price,
  };
}

function categoryRank(category: string): number {
  const index = (SALON_SERVICE_CATEGORY_ORDER as readonly string[]).indexOf(
    category,
  );
  return index === -1 ? 999 : index;
}

export function groupSalonServices(
  services: SalonServiceItem[],
): SalonServiceGroup[] {
  const byCategory = new Map<string, SalonServiceItem[]>();

  for (const service of services) {
    const list = byCategory.get(service.category) ?? [];
    list.push(service);
    byCategory.set(service.category, list);
  }

  return [...byCategory.entries()]
    .sort(([a], [b]) => categoryRank(a) - categoryRank(b))
    .map(([category, items]) => ({
      category,
      services: items,
    }));
}

export async function getServices(
  supabase: AnySupabase,
  salonId: string,
): Promise<{
  services: SalonServiceItem[];
  groups: SalonServiceGroup[];
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("salon_services")
    .select(
      "id, category, name, description, duration_minutes, price, sort_order",
    )
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return { services: [], groups: [], error: error.message };
  }

  const services = ((data ?? []) as ServiceRow[]).map(mapService);
  return {
    services,
    groups: groupSalonServices(services),
    error: null,
  };
}
