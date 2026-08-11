import type {
  ExcludedCandidate,
  MatchCandidate,
  MatchingArea,
  MatchingPartner,
  MatchingService,
  MatchResult,
  ScoreBreakdown,
  StructuredServiceRequest,
  WeeklyWindow,
} from "./types";

/** Normalize "2pm" / "14:00" / "14:00:00" → minutes from midnight. */
export function timeToMinutes(value: string): number | null {
  const trimmed = value.trim().toLowerCase();
  const ampm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2] ?? 0);
    const mer = ampm[3].toLowerCase();
    if (mer === "pm" && hour < 12) hour += 12;
    if (mer === "am" && hour === 12) hour = 0;
    return hour * 60 + minute;
  }
  const parts = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!parts) return null;
  return Number(parts[1]) * 60 + Number(parts[2]);
}

export function resolvePreferredDay(
  request: StructuredServiceRequest,
): number | null {
  if (
    typeof request.preferredDay === "number" &&
    request.preferredDay >= 0 &&
    request.preferredDay <= 6
  ) {
    return request.preferredDay;
  }
  if (request.preferredDate) {
    const d = new Date(`${request.preferredDate}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d.getDay();
  }
  return null;
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Generic slug synonym groups — not category-specific search functions. */
const SERVICE_SYNONYM_GROUPS: string[][] = [
  ["haircut", "hair_cut"],
  ["manicure", "nail_trim"],
  ["lawn_mowing", "lawn_care", "lawn_mow"],
  ["dog_grooming", "pet_grooming"],
];

function synonymSet(token: string): Set<string> {
  const out = new Set<string>([token]);
  for (const group of SERVICE_SYNONYM_GROUPS) {
    if (group.includes(token)) {
      for (const item of group) out.add(item);
    }
  }
  return out;
}

function tokensOverlap(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const left = synonymSet(a);
  const right = synonymSet(b);
  for (const t of left) {
    if (right.has(t)) return true;
  }
  return false;
}

/**
 * Service match is a hard filter.
 * Accepts category_slug equality OR name/slug overlap (lawn_mowing ↔ Lawn Mowing).
 */
export function serviceMatchesRequest(
  service: MatchingService,
  request: StructuredServiceRequest,
): boolean {
  if (!service.isActive) return false;
  const category = normalizeToken(request.serviceCategory);
  const slug = normalizeToken(request.serviceSlug);
  const svcCat = normalizeToken(service.categorySlug);
  const svcName = normalizeToken(service.name);

  if (tokensOverlap(svcCat, category) || tokensOverlap(svcCat, slug)) {
    return true;
  }
  if (tokensOverlap(svcName, slug) || tokensOverlap(svcName, category)) {
    return true;
  }
  return false;
}

export function areaMatchesRequest(
  areas: MatchingArea[],
  serviceId: string,
  request: StructuredServiceRequest,
  suburbPostcode?: string | null,
): boolean {
  const relevant = areas.filter(
    (a) => a.serviceId == null || a.serviceId === serviceId,
  );
  if (!relevant.length) return false;

  const location = request.locationLabel.trim().toLowerCase();
  for (const area of relevant) {
    if (area.mode === "suburb") {
      if (request.suburbId && area.suburbId === request.suburbId) return true;
    }
    if (area.mode === "postcodes") {
      const codes = (area.postcodes ?? []).map((p) => p.trim());
      if (suburbPostcode && codes.includes(suburbPostcode)) return true;
      // Allow location label that is itself a postcode
      if (codes.some((c) => c === request.locationLabel.trim())) return true;
    }
    // Demo suburb labels stored via suburb_id — also accept if catalog tagged
    // the area using a synthetic note in radius mode is not used for Aspley demos.
    void location;
  }
  return false;
}

export function availabilityMatchesRequest(
  availability: MatchingPartner["availability"],
  request: StructuredServiceRequest,
): boolean {
  if (!availability) return false;
  const day = resolvePreferredDay(request);
  const minutes = timeToMinutes(request.preferredTime);
  if (day == null || minutes == null) return false;

  const windows = availability.weeklyWindows ?? [];
  for (const window of windows) {
    if (Number(window.day) !== day) continue;
    const start = timeToMinutes(String(window.start));
    const end = timeToMinutes(String(window.end));
    if (start == null || end == null) continue;
    // Inclusive start, exclusive end (2pm in 09:00-17:00 ✓; 17:00 ✗)
    if (minutes >= start && minutes < end) return true;
  }
  return false;
}

/**
 * Budget hard-filter for priced offers.
 * quote → not a hard fail here (caller routes to separate handling / exclude from priced list).
 */
export function budgetAllowsService(
  service: MatchingService,
  budgetCentsMax: number | null,
): { ok: boolean; reason?: string } {
  if (service.pricingType === "quote") {
    return { ok: false, reason: "quote_pricing_excluded_from_budget_rank" };
  }
  if (budgetCentsMax == null) return { ok: true };
  if (service.priceCents == null) {
    return { ok: false, reason: "missing_price" };
  }
  if (service.priceCents > budgetCentsMax) {
    return { ok: false, reason: `price_${service.priceCents}_above_budget_${budgetCentsMax}` };
  }
  return { ok: true };
}

/** Partner must include every required canonical amenity flag. */
export function amenitiesMatchRequest(
  partner: MatchingPartner,
  requiredAmenities?: string[],
): boolean {
  if (!requiredAmenities?.length) return true;
  const have = new Set(partner.amenities ?? []);
  return requiredAmenities.every((flag) => have.has(flag));
}

/**
 * Scoring (deterministic, no AI):
 * - Hard matches already required: service + area + availability + budget
 * - Base 50
 * - +30 * price_score where price_score = 1 - price/budget (cheaper → higher), clamped 0..1
 * - +15 if budget_match (price <= budget)
 * - +5 availability already satisfied (constant for ranked set)
 *
 * Final score ≈ 0..100
 */
export function scoreMatch(args: {
  service: MatchingService;
  budgetCentsMax: number | null;
  requiredAmenities?: string[];
}): { score: number; breakdown: ScoreBreakdown } {
  const { service, budgetCentsMax, requiredAmenities } = args;
  const price = service.priceCents;
  let priceScore = 0.5;
  if (budgetCentsMax && budgetCentsMax > 0 && price != null) {
    priceScore = Math.max(0, Math.min(1, 1 - price / budgetCentsMax));
  } else if (price != null) {
    priceScore = 0.7;
  }

  const budgetMatch =
    budgetCentsMax == null ||
    (price != null && price <= budgetCentsMax);
  const amenityRequested = Boolean(requiredAmenities?.length);

  const score =
    50 +
    Math.round(priceScore * 30) +
    (budgetMatch ? 15 : 0) +
    5;

  return {
    score: Math.min(100, score),
    breakdown: {
      service_match: true,
      area_match: true,
      availability_match: true,
      budget_match: budgetMatch,
      amenity_match: amenityRequested,
      price_score: Number(priceScore.toFixed(4)),
      pricing_type: service.pricingType,
      price_cents: price,
      reasons: [
        "hard_filters_passed",
        budgetMatch ? "within_budget" : "budget_unknown",
        `price_score_${priceScore.toFixed(2)}`,
      ],
    },
  };
}

function parseWeeklyWindows(raw: unknown): WeeklyWindow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const day = Number(row.day);
      const start = String(row.start ?? "");
      const end = String(row.end ?? "");
      if (!Number.isFinite(day) || !start || !end) return null;
      return { day, start, end };
    })
    .filter((w): w is WeeklyWindow => Boolean(w));
}

export function normalizeCatalogPartner(raw: Record<string, unknown>): MatchingPartner {
  const servicesRaw = Array.isArray(raw.services) ? raw.services : [];
  const areasRaw = Array.isArray(raw.areas) ? raw.areas : [];
  const availabilityRaw =
    raw.availability && typeof raw.availability === "object"
      ? (raw.availability as Record<string, unknown>)
      : null;

  return {
    id: String(raw.id),
    displayName: String(raw.display_name ?? raw.displayName ?? ""),
    partnerType: String(raw.partner_type ?? raw.partnerType ?? ""),
    status: String(raw.status ?? ""),
    isDemo: Boolean(raw.is_demo ?? raw.isDemo),
    bio:
      raw.bio == null
        ? null
        : String(raw.bio),
    address:
      raw.address == null
        ? null
        : String(raw.address),
    latitude:
      raw.latitude == null
        ? null
        : Number(raw.latitude),
    longitude:
      raw.longitude == null
        ? null
        : Number(raw.longitude),
    amenities: Array.isArray(raw.amenities)
      ? (raw.amenities as string[])
      : [],
    services: servicesRaw.map((s) => {
      const row = s as Record<string, unknown>;
      return {
        id: String(row.id),
        partnerId: String(row.partner_id ?? row.partnerId ?? raw.id),
        categorySlug: String(row.category_slug ?? row.categorySlug ?? ""),
        name: String(row.name ?? ""),
        pricingType: (row.pricing_type ??
          row.pricingType ??
          "fixed") as MatchingService["pricingType"],
        priceCents:
          row.price_cents == null && row.priceCents == null
            ? null
            : Number(row.price_cents ?? row.priceCents),
        priceMaxCents:
          row.price_max_cents == null && row.priceMaxCents == null
            ? null
            : Number(row.price_max_cents ?? row.priceMaxCents),
        currency: String(row.currency ?? "AUD"),
        durationMinutes:
          row.duration_minutes == null && row.durationMinutes == null
            ? null
            : Number(row.duration_minutes ?? row.durationMinutes),
        isActive: Boolean(row.is_active ?? row.isActive ?? true),
        attributes:
          row.attributes && typeof row.attributes === "object"
            ? (row.attributes as Record<string, unknown>)
            : null,
      };
    }),
    areas: areasRaw.map((a) => {
      const row = a as Record<string, unknown>;
      return {
        id: String(row.id),
        partnerId: String(row.partner_id ?? row.partnerId ?? raw.id),
        serviceId:
          row.service_id == null && row.serviceId == null
            ? null
            : String(row.service_id ?? row.serviceId),
        mode: (row.mode ?? "suburb") as MatchingArea["mode"],
        suburbId:
          row.suburb_id == null && row.suburbId == null
            ? null
            : String(row.suburb_id ?? row.suburbId),
        centerLat:
          row.center_lat == null && row.centerLat == null
            ? null
            : Number(row.center_lat ?? row.centerLat),
        centerLng:
          row.center_lng == null && row.centerLng == null
            ? null
            : Number(row.center_lng ?? row.centerLng),
        radiusKm:
          row.radius_km == null && row.radiusKm == null
            ? null
            : Number(row.radius_km ?? row.radiusKm),
        postcodes: Array.isArray(row.postcodes)
          ? (row.postcodes as string[])
          : null,
      };
    }),
    availability: availabilityRaw
      ? {
          partnerId: String(
            availabilityRaw.partner_id ?? availabilityRaw.partnerId ?? raw.id,
          ),
          timezone: String(availabilityRaw.timezone ?? "Australia/Brisbane"),
          weeklyWindows: parseWeeklyWindows(
            availabilityRaw.weekly_windows ?? availabilityRaw.weeklyWindows,
          ),
          blackouts: Array.isArray(availabilityRaw.blackouts)
            ? availabilityRaw.blackouts
            : [],
          capacityPerSlot: Number(
            availabilityRaw.capacity_per_slot ??
              availabilityRaw.capacityPerSlot ??
              1,
          ),
        }
      : null,
  };
}

/**
 * Rule-based matcher (no AI).
 * Hard filters: active partner, active service, service, area, availability, budget.
 * quote offers are excluded from the primary ranked list (recorded in excluded).
 */
export function matchPartners(args: {
  request: StructuredServiceRequest;
  partners: MatchingPartner[];
  suburbPostcode?: string | null;
}): MatchResult {
  const matches: MatchCandidate[] = [];
  const excluded: ExcludedCandidate[] = [];

  for (const partner of args.partners) {
    if (partner.status !== "active") {
      excluded.push({
        partner,
        service: null,
        exclusionReason: "partner_not_active",
        scoreBreakdown: { service_match: false },
      });
      continue;
    }

    const candidateServices = partner.services.filter((s) =>
      serviceMatchesRequest(s, args.request),
    );

    if (!candidateServices.length) {
      excluded.push({
        partner,
        service: partner.services[0] ?? null,
        exclusionReason: "service_mismatch",
        scoreBreakdown: { service_match: false },
      });
      continue;
    }

    for (const service of candidateServices) {
      if (!service.isActive) {
        excluded.push({
          partner,
          service,
          exclusionReason: "service_inactive",
          scoreBreakdown: { service_match: false },
        });
        continue;
      }

      const areaOk = areaMatchesRequest(
        partner.areas,
        service.id,
        args.request,
        args.suburbPostcode,
      );
      if (!areaOk) {
        excluded.push({
          partner,
          service,
          exclusionReason: "area_mismatch",
          scoreBreakdown: { service_match: true, area_match: false },
        });
        continue;
      }

      const availOk = availabilityMatchesRequest(
        partner.availability,
        args.request,
      );
      if (!availOk) {
        excluded.push({
          partner,
          service,
          exclusionReason: "availability_mismatch",
          scoreBreakdown: {
            service_match: true,
            area_match: true,
            availability_match: false,
          },
        });
        continue;
      }

      if (!amenitiesMatchRequest(partner, args.request.requiredAmenities)) {
        excluded.push({
          partner,
          service,
          exclusionReason: "amenity_mismatch",
          scoreBreakdown: {
            service_match: true,
            area_match: true,
            availability_match: true,
            amenity_match: false,
          },
        });
        continue;
      }

      const budget = budgetAllowsService(service, args.request.budgetCentsMax);
      if (!budget.ok) {
        excluded.push({
          partner,
          service,
          exclusionReason: budget.reason ?? "budget_mismatch",
          scoreBreakdown: {
            service_match: true,
            area_match: true,
            availability_match: true,
            budget_match: false,
            pricing_type: service.pricingType,
            price_cents: service.priceCents,
          },
        });
        continue;
      }

      const { score, breakdown } = scoreMatch({
        service,
        budgetCentsMax: args.request.budgetCentsMax,
        requiredAmenities: args.request.requiredAmenities,
      });

      matches.push({
        partner,
        service,
        score,
        scoreBreakdown: breakdown,
        exclusionReason: null,
      });
    }
  }

  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const pa = a.service.priceCents ?? Number.POSITIVE_INFINITY;
    const pb = b.service.priceCents ?? Number.POSITIVE_INFINITY;
    return pa - pb;
  });

  return { matches, excluded, request: args.request };
}
