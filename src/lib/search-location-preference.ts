/**
 * Persist the shopper's last known search location in the browser.
 * Used so "Near me" / previous visits can prefill search without asking every time.
 */

export type SavedSearchLocation = {
  label: string;
  lat: number;
  lng: number;
  savedAt: string;
};

const STORAGE_KEY = "allbook.search.location.v1";

function isValidSaved(value: unknown): value is SavedSearchLocation {
  if (!value || typeof value !== "object") return false;
  const row = value as SavedSearchLocation;
  return (
    typeof row.label === "string" &&
    row.label.trim().length > 0 &&
    Number.isFinite(row.lat) &&
    Number.isFinite(row.lng)
  );
}

export function readSavedSearchLocation(): SavedSearchLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidSaved(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSearchLocation(input: {
  label: string;
  lat: number;
  lng: number;
}): SavedSearchLocation | null {
  if (typeof window === "undefined") return null;
  const label = input.label.trim();
  if (!label || !Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return null;
  }
  const saved: SavedSearchLocation = {
    label,
    lat: input.lat,
    lng: input.lng,
    savedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Private mode / quota — ignore; in-memory flow still works for this session.
  }
  return saved;
}

export function clearSavedSearchLocation(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
