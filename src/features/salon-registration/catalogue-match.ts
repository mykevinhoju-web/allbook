import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeName,
  normalizePhone,
  normalizeWebsite,
} from "@/features/marketplace-review/duplicates";
import type { Database } from "@/types/database";

type AnySupabase = SupabaseClient<Database>;

export type CatalogueMatchReason =
  | "google_place_id"
  | "same_phone"
  | "name_and_suburb"
  | "name_and_address"
  | "same_website";

export type CatalogueMatch = {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  address: string | null;
  googlePlaceId: string | null;
  claimed: boolean;
  ownershipStatus: string;
  reasons: CatalogueMatchReason[];
  /** Hard matches must block manual create and force claim */
  hard: boolean;
};

export type CatalogueMatchInput = {
  businessName?: string | null;
  phone?: string | null;
  address?: string | null;
  suburb?: string | null;
  postcode?: string | null;
  website?: string | null;
  googlePlaceId?: string | null;
};

type SalonMatchRow = {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  address: string | null;
  website: string | null;
  google_place_id: string | null;
  claimed: boolean;
  ownership_status: string | null;
};

const SELECT_COLS =
  "id, name, slug, suburb, city, state, phone, address, website, google_place_id, claimed, ownership_status";

function normalizeAddress(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function quoteIlike(value: string): string {
  return `"%${value.replace(/"/g, "").slice(0, 48)}%"`;
}

function namesOverlap(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const ta = new Set(na.split(" ").filter((t) => t.length > 2));
  const tb = new Set(nb.split(" ").filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) if (tb.has(t)) overlap += 1;
  return overlap / Math.min(ta.size, tb.size) >= 0.7;
}

/**
 * Find catalogue salons that overlap with a registration attempt.
 * Phone / place_id / name+suburb|address = hard block → claim instead.
 */
export async function findCatalogueMatches(
  supabase: AnySupabase,
  input: CatalogueMatchInput,
): Promise<CatalogueMatch[]> {
  const placeId = input.googlePlaceId?.trim() || null;
  const phone = normalizePhone(input.phone);
  const rawName = (input.businessName ?? "").trim();
  const suburb = (input.suburb ?? "").trim().toLowerCase();
  const address = normalizeAddress(input.address);
  const website = normalizeWebsite(input.website);

  const matches = new Map<string, CatalogueMatch>();

  function upsert(row: SalonMatchRow, reason: CatalogueMatchReason, hard: boolean) {
    const existing = matches.get(row.id);
    if (existing) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      existing.hard = existing.hard || hard;
      return;
    }
    matches.set(row.id, {
      id: row.id,
      name: row.name,
      slug: row.slug,
      suburb: row.suburb,
      city: row.city,
      state: row.state,
      phone: row.phone,
      address: row.address,
      googlePlaceId: row.google_place_id,
      claimed: row.claimed,
      ownershipStatus: row.ownership_status ?? "unclaimed",
      reasons: [reason],
      hard,
    });
  }

  function consider(row: SalonMatchRow) {
    if (placeId && row.google_place_id === placeId) {
      upsert(row, "google_place_id", true);
    }

    const rowPhone = normalizePhone(row.phone);
    if (phone && rowPhone && phone === rowPhone) {
      upsert(row, "same_phone", true);
    }

    const rowWeb = normalizeWebsite(row.website);
    if (website && rowWeb && website === rowWeb) {
      upsert(row, "same_website", true);
    }

    if (rawName && namesOverlap(rawName, row.name)) {
      const rowSuburb = (row.suburb ?? "").trim().toLowerCase();
      if (suburb && rowSuburb && suburb === rowSuburb) {
        upsert(row, "name_and_suburb", true);
      }
      const rowAddress = normalizeAddress(row.address);
      if (
        address.length >= 6 &&
        rowAddress.length >= 6 &&
        (address === rowAddress ||
          address.includes(rowAddress) ||
          rowAddress.includes(address))
      ) {
        upsert(row, "name_and_address", true);
      }
    }
  }

  if (placeId) {
    const { data } = await supabase
      .from("salons")
      .select(SELECT_COLS)
      .eq("google_place_id", placeId)
      .eq("is_synthetic", false)
      .limit(5);
    for (const row of (data ?? []) as SalonMatchRow[]) consider(row);
  }

  const orParts: string[] = [];
  if (rawName) orParts.push(`name.ilike.${quoteIlike(rawName)}`);
  if (suburb) orParts.push(`suburb.ilike.${quoteIlike(suburb)}`);
  if (phone) {
    const last = phone.slice(-8);
    orParts.push(`phone.ilike."%${last}%"`);
  }
  if (website) orParts.push(`website.ilike.${quoteIlike(website)}`);

  if (orParts.length > 0) {
    const { data } = await supabase
      .from("salons")
      .select(SELECT_COLS)
      .eq("is_synthetic", false)
      .or(orParts.join(","))
      .limit(120);
    for (const row of (data ?? []) as SalonMatchRow[]) consider(row);
  }

  return [...matches.values()].sort((a, b) => {
    if (a.hard !== b.hard) return a.hard ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function hardCatalogueMatches(
  matches: CatalogueMatch[],
): CatalogueMatch[] {
  return matches.filter((m) => m.hard);
}
