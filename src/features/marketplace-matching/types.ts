/**
 * Weekly availability windows for Partner matching.
 * day: JS Date.getDay() — 0=Sun … 6=Sat
 * start/end: "HH:MM" 24h local to the partner timezone (Phase 1: compared as clock time).
 */
export type WeeklyWindow = {
  day: number;
  start: string;
  end: string;
};

export type StructuredServiceRequest = {
  rawQuery?: string;
  serviceCategory: string;
  serviceSlug: string;
  locationLabel: string;
  suburbId?: string | null;
  /** 0=Sun … 6=Sat; if omitted, derived from preferredDate */
  preferredDay?: number | null;
  preferredDate?: string | null;
  /** "HH:MM" */
  preferredTime: string;
  budgetCentsMax: number | null;
  urgency?: "low" | "normal" | "high";
};

export type MatchingService = {
  id: string;
  partnerId: string;
  categorySlug: string;
  name: string;
  pricingType: "fixed" | "hourly" | "from" | "quote";
  priceCents: number | null;
  priceMaxCents: number | null;
  currency: string;
  durationMinutes: number | null;
  isActive: boolean;
};

export type MatchingArea = {
  id: string;
  partnerId: string;
  serviceId: string | null;
  mode: "suburb" | "radius" | "postcodes";
  suburbId: string | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  postcodes: string[] | null;
};

export type MatchingAvailability = {
  partnerId: string;
  timezone: string;
  weeklyWindows: WeeklyWindow[];
  blackouts: unknown[];
  capacityPerSlot: number;
};

export type MatchingPartner = {
  id: string;
  displayName: string;
  partnerType: string;
  status: string;
  isDemo: boolean;
  services: MatchingService[];
  areas: MatchingArea[];
  availability: MatchingAvailability | null;
};

export type ScoreBreakdown = {
  service_match: boolean;
  area_match: boolean;
  availability_match: boolean;
  budget_match: boolean;
  price_score: number;
  pricing_type: string;
  price_cents: number | null;
  reasons: string[];
};

export type MatchCandidate = {
  partner: MatchingPartner;
  service: MatchingService;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  exclusionReason: null;
};

export type ExcludedCandidate = {
  partner: MatchingPartner;
  service: MatchingService | null;
  exclusionReason: string;
  scoreBreakdown: Partial<ScoreBreakdown>;
};

export type MatchResult = {
  matches: MatchCandidate[];
  excluded: ExcludedCandidate[];
  request: StructuredServiceRequest;
};
