import { createHash } from "node:crypto";

import type { GoogleManagedSnapshot } from "./types";

/** Stable payload for change detection — Google-managed fields only. */
export type GoogleSnapshotHashInput = {
  name: string;
  address: string | null;
  suburb: string | null;
  city: string;
  state: string;
  postcode: string | null;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  rating: number;
  reviewCount: number;
  openingHours: unknown;
  googleCategories: string[];
  photoNames: string[];
  businessStatus: string | null;
};

function roundCoord(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

export function buildHashInputFromSnapshot(
  snapshot: GoogleManagedSnapshot,
  /** When owner overrides name, hash uses stored name so Google rename alone does not force a write of name. */
  hashName: string,
): GoogleSnapshotHashInput {
  return {
    name: hashName,
    address: snapshot.address,
    suburb: snapshot.suburb,
    city: snapshot.city,
    state: snapshot.state,
    postcode: snapshot.postcode,
    country: snapshot.country,
    latitude: roundCoord(snapshot.latitude),
    longitude: roundCoord(snapshot.longitude),
    phone: snapshot.phone,
    website: snapshot.website,
    rating: snapshot.rating,
    reviewCount: snapshot.reviewCount,
    openingHours: snapshot.openingHours,
    googleCategories: [...snapshot.googleCategories].sort(),
    photoNames: snapshot.photos.map((p) => p.name).sort(),
    businessStatus: snapshot.businessStatus,
  };
}

export function hashGoogleSnapshot(input: GoogleSnapshotHashInput): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

export function listChangedGoogleFields(
  before: GoogleSnapshotHashInput,
  after: GoogleSnapshotHashInput,
): string[] {
  const keys = Object.keys(after) as Array<keyof GoogleSnapshotHashInput>;
  const changed: string[] = [];
  for (const key of keys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(String(key));
    }
  }
  return changed;
}
