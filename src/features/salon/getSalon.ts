import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { SalonDetail, SalonGalleryImage, SalonRow } from "@/types/salon";

import { mapSalonDetail } from "./map-salon-detail";

type AnySupabase = SupabaseClient<Database>;

type SalonImageRow = {
  id: string;
  url: string;
  alt: string | null;
  sort_order: number;
};

function mapGallery(rows: SalonImageRow[]): SalonGalleryImage[] {
  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    alt: row.alt?.trim() || "Salon photo",
    sortOrder: row.sort_order,
  }));
}

/**
 * Load a single marketplace salon + gallery for the detail page.
 */
export async function getSalon(
  supabase: AnySupabase,
  salonId: string,
): Promise<{ salon: SalonDetail | null; error: string | null }> {
  const id = salonId.trim();
  if (!id) {
    return { salon: null, error: "Salon id is required" };
  }

  const [{ data, error }, galleryResult] = await Promise.all([
    supabase.from("salons").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("salon_images")
      .select("id, url, alt, sort_order")
      .eq("salon_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return { salon: null, error: error.message };
  }

  if (!data) {
    return { salon: null, error: null };
  }

  if (galleryResult.error) {
    return { salon: null, error: galleryResult.error.message };
  }

  const gallery = mapGallery((galleryResult.data ?? []) as SalonImageRow[]);
  const salon = mapSalonDetail(data as SalonRow, gallery);

  // Prefer cover as first gallery tile when gallery is empty.
  if (salon.gallery.length === 0 && salon.coverImage) {
    salon.gallery = [
      {
        id: `${salon.id}-cover`,
        url: salon.coverImage,
        alt: salon.name,
        sortOrder: 0,
      },
    ];
  }

  return { salon, error: null };
}
