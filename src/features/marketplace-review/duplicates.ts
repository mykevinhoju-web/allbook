import type {
  DuplicateMatchReason,
  DuplicateSuggestion,
  ReviewQueueItem,
  ReviewStatus,
} from "./types";

type SalonDupRow = {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  source: string;
  claimed: boolean;
  review_status: ReviewStatus;
  marketplace_visible: boolean;
  permanently_closed: boolean;
  google_place_id: string | null;
  google_business_status: string | null;
  imported_at: string | null;
  google_synced_at: string | null;
  reviewed_at: string | null;
  duplicate_of_salon_id: string | null;
  cover_image: string | null;
  latitude: number;
  longitude: number;
};

export function mapQueueItem(row: {
  id: string;
  name: string;
  slug: string;
  suburb: string | null;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  rating: number;
  review_count: number;
  source: string;
  claimed: boolean;
  review_status: ReviewStatus;
  marketplace_visible: boolean;
  permanently_closed: boolean;
  google_place_id: string | null;
  google_business_status: string | null;
  imported_at: string | null;
  google_synced_at: string | null;
  reviewed_at: string | null;
  duplicate_of_salon_id: string | null;
  cover_image: string | null;
}): ReviewQueueItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    suburb: row.suburb,
    city: row.city,
    state: row.state,
    phone: row.phone,
    website: row.website,
    rating: Number(row.rating ?? 0),
    reviewCount: row.review_count ?? 0,
    source: row.source,
    claimed: row.claimed,
    reviewStatus: row.review_status,
    marketplaceVisible: row.marketplace_visible,
    permanentlyClosed: row.permanently_closed,
    googlePlaceId: row.google_place_id,
    googleBusinessStatus: row.google_business_status,
    importedAt: row.imported_at,
    googleSyncedAt: row.google_synced_at,
    reviewedAt: row.reviewed_at,
    duplicateOfSalonId: row.duplicate_of_salon_id,
    coverImage: row.cover_image,
  };
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  return digits.slice(-9);
}

export function normalizeWebsite(
  website: string | null | undefined,
): string | null {
  if (!website) return null;
  try {
    const url = new URL(
      website.startsWith("http") ? website : `https://${website}`,
    );
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return website.trim().toLowerCase() || null;
  }
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nameSimilar(a: string, b: string): boolean {
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
 * Suggest possible duplicates. Never merges — admin must approve.
 */
export function findDuplicateSuggestions(
  target: SalonDupRow,
  candidates: SalonDupRow[],
): DuplicateSuggestion[] {
  const out: DuplicateSuggestion[] = [];
  const targetPhone = normalizePhone(target.phone);
  const targetWeb = normalizeWebsite(target.website);

  for (const candidate of candidates) {
    if (candidate.id === target.id) continue;
    if (candidate.duplicate_of_salon_id === target.id) continue;
    if (target.duplicate_of_salon_id === candidate.id) continue;

    const reasons: DuplicateMatchReason[] = [];
    let score = 0;

    if (
      target.google_place_id &&
      candidate.google_place_id &&
      target.google_place_id === candidate.google_place_id
    ) {
      reasons.push("google_place_id");
      score += 100;
    }

    if (nameSimilar(target.name, candidate.name)) {
      reasons.push("similar_name");
      score += 40;
    }

    const candPhone = normalizePhone(candidate.phone);
    if (targetPhone && candPhone && targetPhone === candPhone) {
      reasons.push("same_phone");
      score += 50;
    }

    const candWeb = normalizeWebsite(candidate.website);
    if (targetWeb && candWeb && targetWeb === candWeb) {
      reasons.push("same_website");
      score += 45;
    }

    const meters = haversineMeters(
      { lat: target.latitude, lng: target.longitude },
      { lat: candidate.latitude, lng: candidate.longitude },
    );
    if (meters <= 60) {
      reasons.push("same_coordinates");
      score += 35;
    }

    // Require at least one strong signal or name+proximity.
    if (reasons.length === 0) continue;
    if (
      reasons.length === 1 &&
      reasons[0] === "similar_name" &&
      meters > 2500
    ) {
      continue;
    }

    out.push({
      salon: mapQueueItem(candidate),
      reasons,
      score,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}
