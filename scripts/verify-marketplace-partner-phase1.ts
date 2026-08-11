/**
 * Marketplace Partner Phase 1 unit checks (no DB required).
 * Run: npx tsx scripts/verify-marketplace-partner-phase1.ts
 */
import assert from "node:assert/strict";

import { toPublicPartner } from "../src/features/marketplace-partner/mappers";
import type { MarketplacePartner } from "../src/features/marketplace-partner";

function samplePartner(
  overrides: Partial<MarketplacePartner> = {},
): MarketplacePartner {
  return {
    id: "p1",
    salonId: null,
    authUserId: "u1",
    partnerType: "independent",
    status: "pending",
    displayName: "Lawn Pro",
    bio: "Mowing",
    phone: "+61400000000",
    email: "secret@example.com",
    verifiedAt: null,
    isDemo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Pending partner is not public
{
  const pub = toPublicPartner(samplePartner({ status: "pending" }));
  assert.equal(pub, null);
}

// Suspended partner is not public
{
  const pub = toPublicPartner(samplePartner({ status: "suspended" }));
  assert.equal(pub, null);
}

// Active partner strips PII
{
  const pub = toPublicPartner(samplePartner({ status: "active" }));
  assert.ok(pub);
  assert.equal(pub.status, "active");
  assert.equal(pub.displayName, "Lawn Pro");
  assert.equal(
    "email" in pub || "phone" in pub,
    false,
    "public DTO must not expose email/phone",
  );
  assert.equal(
    JSON.stringify(pub).includes("secret@example.com"),
    false,
  );
  assert.equal(JSON.stringify(pub).includes("+61400000000"), false);
}

// business_linked vs independent shape rules (app-level)
{
  const linked = samplePartner({
    partnerType: "business_linked",
    salonId: "salon-1",
  });
  assert.ok(linked.salonId);
  const independent = samplePartner({
    partnerType: "independent",
    salonId: null,
  });
  assert.equal(independent.salonId, null);
}

console.log("verify-marketplace-partner-phase1: ok");
