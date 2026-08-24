import { parseOpeningHours } from "@/features/salon/map-salon-detail";
import type { DayOfWeek, OpeningHours } from "@/types/salon";
import { NO_PREFERENCE_STAFF_ID } from "@/features/salon-booking/catalog-types";
import { generateAvailableSlots } from "@/features/salon-booking/generateAvailableSlots";
import { getBookingSalonContext } from "@/features/salon-booking/getBookingSalonContext";
import { createSupabaseSalonBookingsRepository } from "@/features/salon-booking/repositories/supabase";
import { createServiceSupabase } from "@/lib/supabase/service";

import type { KoreanSearchHit } from "./types";

const DAY_FROM_WEEKDAY: Record<string, DayOfWeek> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

function dayKeyForIsoDate(iso: string): DayOfWeek {
  const weekday = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    weekday: "short",
  }).format(new Date(`${iso}T12:00:00+10:00`));
  return DAY_FROM_WEEKDAY[weekday] ?? "mon";
}

function hoursAllowWindow(
  hours: OpeningHours,
  dateIso: string,
  timeAfter: string | null,
): boolean {
  const day = hours[dayKeyForIsoDate(dateIso)];
  if (!day || day.closed) return false;
  if (!timeAfter) return true;
  return day.close > timeAfter;
}

async function mapInBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const rows = await Promise.all(chunk.map(fn));
    out.push(...rows);
  }
  return out;
}

/**
 * Keep salons whose stored opening hours include the requested date.
 */
export async function filterHitsOpenOnDate(
  hits: KoreanSearchHit[],
  dateIso: string,
): Promise<KoreanSearchHit[]> {
  if (hits.length === 0) return hits;
  const service = createServiceSupabase();
  const { data } = await service
    .from("salons")
    .select("id, opening_hours")
    .in(
      "id",
      hits.map((hit) => hit.id),
    );
  const hoursById = new Map(
    (data ?? []).map((row) => [row.id, parseOpeningHours(row.opening_hours)]),
  );
  return hits.filter((hit) =>
    hoursAllowWindow(hoursById.get(hit.id) ?? {}, dateIso, null),
  );
}

/**
 * Keep salons that have a real bookable slot on the requested date/time.
 * Uses the existing salon booking engine — no new tables.
 */
export async function filterHitsByBookingSlot(
  hits: KoreanSearchHit[],
  dateIso: string,
  timeAfter: string | null,
): Promise<KoreanSearchHit[]> {
  if (hits.length === 0) return hits;

  const service = createServiceSupabase();
  const { data } = await service
    .from("salons")
    .select("id, slug, opening_hours")
    .in(
      "id",
      hits.map((hit) => hit.id),
    );

  const hoursById = new Map(
    (data ?? []).map((row) => [
      row.id,
      parseOpeningHours(row.opening_hours),
    ]),
  );
  const slugById = new Map((data ?? []).map((row) => [row.id, row.slug]));

  const openHits = hits.filter((hit) =>
    hoursAllowWindow(hoursById.get(hit.id) ?? {}, dateIso, timeAfter),
  );

  const repo = createSupabaseSalonBookingsRepository(service);
  const matchedIds = new Set<string>();

  await mapInBatches(openHits, 4, async (hit) => {
    const slug = slugById.get(hit.id);
    if (!slug) return;
    const { context } = await getBookingSalonContext(service, slug);
    if (!context || context.services.length === 0) return;

    const existingBookingsByStaff: Record<
      string,
      { startTime: string; endTime: string; bufferMinutes?: number }[]
    > = {};
    await Promise.all(
      context.staff.map(async (member) => {
        const rows = await repo.listStaffBookingsForDate({
          salonId: context.salonId,
          staffId: member.id,
          bookingDate: dateIso,
        });
        existingBookingsByStaff[member.id] = rows.map((row) => ({
          startTime: row.startTime,
          endTime: row.endTime,
          bufferMinutes: row.bufferMinutes,
        }));
      }),
    );

    for (const catalogService of context.services) {
      const slots = generateAvailableSlots({
        context,
        staffId: NO_PREFERENCE_STAFF_ID,
        serviceId: catalogService.id,
        serviceDuration: catalogService.duration,
        date: dateIso,
        existingBookingsByStaff,
      });
      const ok = slots.some(
        (slot) =>
          slot.available && (!timeAfter || slot.startTime >= timeAfter),
      );
      if (ok) {
        matchedIds.add(hit.id);
        return;
      }
    }
  });

  return hits.filter((hit) => matchedIds.has(hit.id));
}
