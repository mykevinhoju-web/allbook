import type { GoogleImportGeoScope, GoogleImportTarget } from "./types";

export type ImportGeoCell = {
  /** Human label for progress UI */
  label: string;
  country: string;
  state: string;
  city: string;
  suburb?: string;
  biasRadiusMeters: number;
  defaultMaxPages: number;
};

/** Major AU cells — country-scope fans out here without redesign. */
export const AUSTRALIA_IMPORT_CELLS: Omit<
  ImportGeoCell,
  "biasRadiusMeters" | "defaultMaxPages"
>[] = [
  { label: "Sydney NSW", country: "Australia", state: "New South Wales", city: "Sydney" },
  { label: "Newcastle NSW", country: "Australia", state: "New South Wales", city: "Newcastle" },
  { label: "Melbourne VIC", country: "Australia", state: "Victoria", city: "Melbourne" },
  { label: "Geelong VIC", country: "Australia", state: "Victoria", city: "Geelong" },
  { label: "Brisbane QLD", country: "Australia", state: "Queensland", city: "Brisbane" },
  { label: "Gold Coast QLD", country: "Australia", state: "Queensland", city: "Gold Coast" },
  { label: "Sunshine Coast QLD", country: "Australia", state: "Queensland", city: "Sunshine Coast" },
  { label: "Perth WA", country: "Australia", state: "Western Australia", city: "Perth" },
  { label: "Adelaide SA", country: "Australia", state: "South Australia", city: "Adelaide" },
  { label: "Hobart TAS", country: "Australia", state: "Tasmania", city: "Hobart" },
  { label: "Canberra ACT", country: "Australia", state: "Australian Capital Territory", city: "Canberra" },
  { label: "Darwin NT", country: "Australia", state: "Northern Territory", city: "Darwin" },
];

const QLD_CITIES = [
  "Brisbane",
  "Gold Coast",
  "Sunshine Coast",
  "Townsville",
  "Cairns",
  "Toowoomba",
];

function scopeOf(target: GoogleImportTarget): GoogleImportGeoScope {
  return target.scope ?? (target.city ? "city" : "country");
}

/**
 * Expand an admin target into one or more search cells.
 * Suburb/city → 1 cell; state/country → fan-out cells (same engine).
 */
export function resolveImportGeoCells(
  target: GoogleImportTarget,
): ImportGeoCell[] {
  const scope = scopeOf(target);
  const country = target.country.trim() || "Australia";

  if (scope === "suburb") {
    const locality = (target.suburb || target.city || "").trim();
    const state = (target.state || "").trim();
    if (!locality || !state) {
      throw new Error("Suburb scope requires state and suburb/city.");
    }
    return [
      {
        label: `${locality}, ${state}`,
        country,
        state,
        city: locality,
        suburb: locality,
        biasRadiusMeters: 8_000,
        defaultMaxPages: 3,
      },
    ];
  }

  if (scope === "city") {
    const city = (target.city || "").trim();
    const state = (target.state || "").trim();
    if (!city || !state) {
      throw new Error("City scope requires state and city.");
    }
    return [
      {
        label: `${city}, ${state}`,
        country,
        state,
        city,
        biasRadiusMeters: 25_000,
        defaultMaxPages: 5,
      },
    ];
  }

  if (scope === "state") {
    const state = (target.state || "").trim();
    if (!state) throw new Error("State scope requires state.");

    if (/queensland|qld/i.test(state) && /australia/i.test(country)) {
      return QLD_CITIES.map((city) => ({
        label: `${city}, ${state}`,
        country,
        state,
        city,
        biasRadiusMeters: 35_000,
        defaultMaxPages: 4,
      }));
    }

    const inState = AUSTRALIA_IMPORT_CELLS.filter(
      (c) =>
        c.state.toLowerCase() === state.toLowerCase() ||
        c.state.toLowerCase().includes(state.toLowerCase()) ||
        state.toLowerCase().includes(c.state.toLowerCase()),
    );
    if (inState.length > 0) {
      return inState.map((c) => ({
        ...c,
        biasRadiusMeters: 40_000,
        defaultMaxPages: 4,
      }));
    }

    // Generic state: single large bias around state name as city query
    return [
      {
        label: state,
        country,
        state,
        city: state,
        biasRadiusMeters: 150_000,
        defaultMaxPages: 8,
      },
    ];
  }

  // country
  if (/australia/i.test(country)) {
    return AUSTRALIA_IMPORT_CELLS.map((c) => ({
      ...c,
      biasRadiusMeters: 40_000,
      defaultMaxPages: 4,
    }));
  }

  return [
    {
      label: country,
      country,
      state: target.state?.trim() || country,
      city: target.city?.trim() || country,
      biasRadiusMeters: 200_000,
      defaultMaxPages: 8,
    },
  ];
}

export const IMPORT_SCOPE_OPTIONS: {
  id: GoogleImportGeoScope;
  label: string;
  description: string;
}[] = [
  {
    id: "suburb",
    label: "One suburb",
    description: "Tight radius around a suburb (~8 km).",
  },
  {
    id: "city",
    label: "One city",
    description: "City-wide discovery (~25 km).",
  },
  {
    id: "state",
    label: "One state",
    description: "Fans out across major cities in the state.",
  },
  {
    id: "country",
    label: "Entire Australia",
    description: "Fans out across capital / major metro cells.",
  },
];
