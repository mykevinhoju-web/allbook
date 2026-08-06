import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { ImportSalonsResult, SalonImportRecord } from "./import-types";

type AnySupabase = SupabaseClient<Database>;

const BATCH_SIZE = 50;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Upsert marketplace salons at scale.
 * Resolves category + suburb FKs, then writes salon / images / services / staff.
 * Safe to re-run (keyed by slug).
 */
export async function importSalons(
  supabase: AnySupabase,
  records: SalonImportRecord[],
): Promise<ImportSalonsResult> {
  const result: ImportSalonsResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (records.length === 0) return result;

  const [{ data: categories, error: catError }, { data: suburbs, error: subError }] =
    await Promise.all([
      supabase.from("business_categories").select("id, slug"),
      supabase.from("suburbs").select("id, name, postcode, city, state, country"),
    ]);

  if (catError) {
    result.errors.push(catError.message);
    return result;
  }
  if (subError) {
    result.errors.push(subError.message);
    return result;
  }

  const categoryBySlug = new Map(
    (categories ?? []).map((row) => [row.slug, row.id]),
  );
  const suburbByName = new Map(
    (suburbs ?? []).map((row) => [row.name.toLowerCase(), row]),
  );

  for (const batch of chunk(records, BATCH_SIZE)) {
    for (const record of batch) {
      try {
        const categoryId = categoryBySlug.get(record.categorySlug);
        if (!categoryId) {
          result.skipped += 1;
          result.errors.push(
            `Missing category "${record.categorySlug}" for ${record.slug}`,
          );
          continue;
        }

        const suburb = suburbByName.get(record.suburbName.toLowerCase());
        if (!suburb) {
          result.skipped += 1;
          result.errors.push(
            `Missing suburb "${record.suburbName}" for ${record.slug}`,
          );
          continue;
        }

        const { data: existing } = await supabase
          .from("salons")
          .select("id")
          .eq("slug", record.slug)
          .maybeSingle();

        const payload = {
          category_id: categoryId,
          suburb_id: suburb.id,
          name: record.name,
          slug: record.slug,
          description: record.description,
          phone: record.phone,
          email: record.email,
          website: record.website,
          address: record.address,
          suburb: suburb.name,
          city: suburb.city,
          state: suburb.state,
          postcode: suburb.postcode,
          country: suburb.country,
          latitude: record.latitude,
          longitude: record.longitude,
          cover_image: record.coverImage,
          logo: record.logo,
          rating: record.rating,
          review_count: record.reviewCount,
          verified: record.verified,
          primary_service: record.primaryService,
          starting_price: record.startingPrice,
          price_min: record.priceMin,
          price_max: record.priceMax,
          amenities: record.amenities,
          service_tags: record.serviceTags,
          opening_hours: record.openingHours as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        };

        let salonId = existing?.id ?? null;

        if (existing?.id) {
          const { error } = await supabase
            .from("salons")
            .update(payload)
            .eq("id", existing.id);
          if (error) throw new Error(error.message);
          result.updated += 1;
        } else {
          const { data, error } = await supabase
            .from("salons")
            .insert(payload)
            .select("id")
            .single();
          if (error) throw new Error(error.message);
          salonId = data.id;
          result.inserted += 1;
        }

        if (!salonId) continue;

        if (record.gallery?.length) {
          await supabase.from("salon_images").delete().eq("salon_id", salonId);
          const { error: imageError } = await supabase.from("salon_images").insert(
            record.gallery.map((image, index) => ({
              salon_id: salonId!,
              url: image.url,
              alt: image.alt ?? record.name,
              sort_order: image.sortOrder ?? index,
            })),
          );
          if (imageError) throw new Error(imageError.message);
        }

        if (record.services?.length) {
          await supabase.from("salon_services").delete().eq("salon_id", salonId);
          const { error: serviceError } = await supabase
            .from("salon_services")
            .insert(
              record.services.map((service, index) => ({
                salon_id: salonId!,
                category: service.category,
                name: service.name,
                description: service.description ?? null,
                duration_minutes: service.durationMinutes,
                price: service.price,
                sort_order: service.sortOrder ?? index,
                is_active: true,
              })),
            );
          if (serviceError) throw new Error(serviceError.message);
        }

        if (record.staff?.length) {
          await supabase.from("salon_staff").delete().eq("salon_id", salonId);
          const { error: staffError } = await supabase.from("salon_staff").insert(
            record.staff.map((member, index) => ({
              salon_id: salonId!,
              name: member.name,
              position: member.position,
              photo_url: member.photoUrl ?? null,
              years_experience: member.yearsExperience,
              languages: member.languages ?? ["English"],
              specialties: member.specialties ?? [],
              sort_order: member.sortOrder ?? index,
              is_active: true,
            })),
          );
          if (staffError) throw new Error(staffError.message);
        }
      } catch (err) {
        result.skipped += 1;
        result.errors.push(
          err instanceof Error
            ? `${record.slug}: ${err.message}`
            : `${record.slug}: import failed`,
        );
      }
    }
  }

  return result;
}
