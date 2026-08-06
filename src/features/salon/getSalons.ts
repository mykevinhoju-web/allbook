import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { GetSalonsParams, Salon, SalonRow } from "@/types/salon";

type AnySupabase = SupabaseClient<Database>;

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

export function mapSalonRow(row: SalonRow): Salon {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    phone: row.phone,
    email: row.email,
    website: row.website,
    coverImage: row.cover_image?.trim() || FALLBACK_COVER,
    logo: row.logo,
    address: row.address,
    suburb: row.suburb?.trim() || row.city,
    city: row.city,
    state: row.state,
    postcode: row.postcode,
    country: row.country,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    rating: Number(row.rating) || 0,
    reviewCount: row.review_count ?? 0,
    verified: row.verified,
    service: row.primary_service?.trim() || "Beauty",
    price: row.starting_price ?? row.price_min ?? 0,
    priceMin: row.price_min ?? null,
    priceMax: row.price_max ?? null,
    categoryId: row.category_id ?? null,
    suburbId: row.suburb_id ?? null,
    slug:
      row.slug?.trim() ||
      row.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
  };
}

function serviceAliases(service: string): string[] {
  const key = service.trim().toLowerCase();
  const map: Record<string, string[]> = {
    hair: ["Hair", "Barber"],
    barber: ["Barber", "Hair"],
  };
  return map[key] ?? [service.trim()];
}

/**
 * Load marketplace salons from Supabase.
 * Pass a browser or server client — no UI logic here.
 */
export async function getSalons(
  supabase: AnySupabase,
  params: GetSalonsParams = {},
): Promise<{ salons: Salon[]; error: string | null }> {
  const location = params.location?.trim() ?? "";
  const service = params.service?.trim() ?? "";

  let query = supabase
    .from("salons")
    .select("*")
    .order("rating", { ascending: false });

  if (location) {
    const safe = location.replace(/[%_,]/g, "").trim();
    if (safe) {
      query = query.or(
        `suburb.ilike.%${safe}%,city.ilike.%${safe}%,name.ilike.%${safe}%,address.ilike.%${safe}%`,
      );
    }
  }

  if (service) {
    const aliases = serviceAliases(service);
    query = query.in("primary_service", aliases);
  }

  const { data, error } = await query;

  if (error) {
    return { salons: [], error: error.message };
  }

  const salons = ((data ?? []) as SalonRow[]).map(mapSalonRow);
  return { salons, error: null };
}
