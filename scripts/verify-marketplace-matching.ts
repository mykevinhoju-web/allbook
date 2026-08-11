/**
 * Marketplace rule-based matching tests (no AI).
 * Unit tests use in-memory fixtures; optional live DB check via catalog RPC.
 *
 * Run: npx tsx scripts/verify-marketplace-matching.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  ASPLEY_SUBURB_ID,
  CHERMSIDE_SUBURB_ID,
  matchPartners,
  normalizeCatalogPartner,
} from "../src/features/marketplace-matching";
import type {
  MatchingPartner,
  StructuredServiceRequest,
} from "../src/features/marketplace-matching";
import type { Database } from "../src/types/database";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

function partner(input: {
  name: string;
  category: string;
  serviceName: string;
  price: number;
  suburbId: string;
  windows: Array<{ day: number; start: string; end: string }>;
}): MatchingPartner {
  const id = `p-${input.name}`;
  const serviceId = `s-${input.name}`;
  return {
    id,
    displayName: input.name,
    partnerType: "independent",
    status: "active",
    isDemo: true,
    amenities: [],
    services: [
      {
        id: serviceId,
        partnerId: id,
        categorySlug: input.category,
        name: input.serviceName,
        pricingType: "fixed",
        priceCents: input.price,
        priceMaxCents: null,
        currency: "AUD",
        durationMinutes: 60,
        isActive: true,
      },
    ],
    areas: [
      {
        id: `a-${input.name}`,
        partnerId: id,
        serviceId: null,
        mode: "suburb",
        suburbId: input.suburbId,
        centerLat: null,
        centerLng: null,
        radiusKm: null,
        postcodes: null,
      },
    ],
    availability: {
      partnerId: id,
      timezone: "Australia/Brisbane",
      weeklyWindows: input.windows,
      blackouts: [],
      capacityPerSlot: 1,
    },
  };
}

const FIXTURES: MatchingPartner[] = [
  partner({
    name: "John's Lawn Care",
    category: "lawn_care",
    serviceName: "Lawn Mowing",
    price: 7000,
    suburbId: ASPLEY_SUBURB_ID,
    windows: [1, 2, 3, 4, 5].map((day) => ({
      day,
      start: "09:00",
      end: "17:00",
    })),
  }),
  partner({
    name: "Green Grass AU",
    category: "lawn_care",
    serviceName: "Lawn Mowing",
    price: 5500,
    suburbId: ASPLEY_SUBURB_ID,
    windows: [1, 2, 3, 4, 5].map((day) => ({
      day,
      start: "13:00",
      end: "18:00",
    })),
  }),
  partner({
    name: "ABC Cleaning",
    category: "cleaning",
    serviceName: "House Cleaning",
    price: 9000,
    suburbId: ASPLEY_SUBURB_ID,
    windows: [2, 4].map((day) => ({ day, start: "10:00", end: "16:00" })),
  }),
  partner({
    name: "Sarah Beauty",
    category: "nail",
    serviceName: "Nail Trim",
    price: 2000,
    suburbId: CHERMSIDE_SUBURB_ID,
    windows: [1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      start: "10:00",
      end: "18:00",
    })),
  }),
  partner({
    name: "Brisbane Mobile Auto",
    category: "automotive",
    serviceName: "Mobile Car Wash",
    price: 6000,
    suburbId: ASPLEY_SUBURB_ID,
    windows: [0, 6].map((day) => ({ day, start: "09:00", end: "17:00" })),
  }),
];

function names(result: ReturnType<typeof matchPartners>) {
  return result.matches.map((m) => m.partner.displayName);
}

function run(
  label: string,
  request: StructuredServiceRequest,
  expected: string[],
) {
  const result = matchPartners({
    request,
    partners: FIXTURES,
    suburbPostcode: request.locationLabel === "Aspley" ? "4034" : "4032",
  });
  assert.deepEqual(
    names(result),
    expected,
    `${label}: expected ${expected.join(", ") || "(none)"} got ${names(result).join(", ") || "(none)"}`,
  );
  console.log(`PASS ${label} → ${expected.join(", ") || "(none)"}`);
  return result;
}

// TEST 1
{
  const result = run(
    "TEST1 lawn Aspley 14:00 under $80",
    {
      serviceCategory: "lawn_care",
      serviceSlug: "lawn_mowing",
      locationLabel: "Aspley",
      suburbId: ASPLEY_SUBURB_ID,
      preferredDay: 1,
      preferredTime: "14:00",
      budgetCentsMax: 8000,
    },
    ["Green Grass AU", "John's Lawn Care"],
  );
  assert.ok(result.matches[0].score >= result.matches[1].score);
  assert.equal(result.matches[0].service.priceCents, 5500);
}

// TEST 2 — ABC available but over budget
{
  const result = matchPartners({
    request: {
      serviceCategory: "cleaning",
      serviceSlug: "house_cleaning",
      locationLabel: "Aspley",
      suburbId: ASPLEY_SUBURB_ID,
      preferredDay: 2,
      preferredTime: "14:00",
      budgetCentsMax: 8000,
    },
    partners: FIXTURES,
  });
  assert.deepEqual(names(result), []);
  const abc = result.excluded.find(
    (e) => e.partner.displayName === "ABC Cleaning",
  );
  assert.ok(abc);
  assert.match(abc!.exclusionReason, /budget|price_/);
  console.log("PASS TEST2 cleaning under $80 → none (ABC over budget)");
}

// TEST 3
run(
  "TEST3 nail Chermside under $30",
  {
    serviceCategory: "nail",
    serviceSlug: "nail_trim",
    locationLabel: "Chermside",
    suburbId: CHERMSIDE_SUBURB_ID,
    preferredDay: 3,
    preferredTime: "14:00",
    budgetCentsMax: 3000,
  },
  ["Sarah Beauty"],
);

// TEST 4
run(
  "TEST4 car wash Sat 14:00 under $70",
  {
    serviceCategory: "automotive",
    serviceSlug: "mobile_car_wash",
    locationLabel: "Aspley",
    suburbId: ASPLEY_SUBURB_ID,
    preferredDay: 6,
    preferredTime: "14:00",
    budgetCentsMax: 7000,
  },
  ["Brisbane Mobile Auto"],
);

// TEST 5
run(
  "TEST5 lawn Chermside → none",
  {
    serviceCategory: "lawn_care",
    serviceSlug: "lawn_mowing",
    locationLabel: "Chermside",
    suburbId: CHERMSIDE_SUBURB_ID,
    preferredDay: 1,
    preferredTime: "14:00",
    budgetCentsMax: 8000,
  },
  [],
);

// TEST 6
{
  const result = matchPartners({
    request: {
      serviceCategory: "lawn_care",
      serviceSlug: "lawn_mowing",
      locationLabel: "Aspley",
      suburbId: ASPLEY_SUBURB_ID,
      preferredDay: 1,
      preferredTime: "20:00",
      budgetCentsMax: 8000,
    },
    partners: FIXTURES,
  });
  assert.deepEqual(names(result), []);
  assert.ok(
    result.excluded.some((e) => e.exclusionReason === "availability_mismatch"),
  );
  console.log("PASS TEST6 lawn 20:00 → none (availability)");
}

async function liveDbCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log("SKIP live DB catalog (missing supabase env)");
    return;
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.rpc(
    "load_marketplace_matching_catalog",
  );
  if (error) throw new Error(error.message);
  const partners = (Array.isArray(data) ? data : []).map((row) =>
    normalizeCatalogPartner(row as unknown as Record<string, unknown>),
  );
  const demo = partners.filter((p) => p.isDemo);
  assert.ok(demo.length >= 5, `expected >=5 demo partners, got ${demo.length}`);

  const result = matchPartners({
    request: {
      serviceCategory: "lawn_care",
      serviceSlug: "lawn_mowing",
      locationLabel: "Aspley",
      suburbId: ASPLEY_SUBURB_ID,
      preferredDay: 1,
      preferredTime: "14:00",
      budgetCentsMax: 8000,
    },
    partners: demo,
  });
  assert.deepEqual(names(result), ["Green Grass AU", "John's Lawn Care"]);
  console.log("PASS live DB catalog matching");
}

liveDbCheck()
  .then(() => {
    console.log("verify-marketplace-matching: all assertions passed");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
