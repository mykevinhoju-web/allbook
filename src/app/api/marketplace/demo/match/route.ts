import { NextResponse } from "next/server";

import {
  assertMarketplaceDemoAllowed,
  runMarketplaceMatch,
} from "@/features/marketplace-matching";
import type { StructuredServiceRequest } from "@/features/marketplace-matching";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/demo/match
 * Rule-based matching against live catalog (no AI).
 * Dev / non-production only.
 */
export async function POST(request: Request) {
  try {
    assertMarketplaceDemoAllowed();
    const body = (await request.json()) as {
      request?: StructuredServiceRequest;
      persist?: boolean;
    };
    if (!body.request) {
      return NextResponse.json({ error: "request is required." }, { status: 400 });
    }

    const supabase = createServiceSupabase();
    const result = await runMarketplaceMatch({
      supabase,
      request: body.request,
      persist: body.persist !== false,
      isDemo: true,
    });

    return NextResponse.json({
      requestId: result.requestId,
      matches: result.matches.map((m) => ({
        partnerId: m.partner.id,
        displayName: m.partner.displayName,
        serviceName: m.service.name,
        categorySlug: m.service.categorySlug,
        priceCents: m.service.priceCents,
        pricingType: m.service.pricingType,
        score: m.score,
        scoreBreakdown: m.scoreBreakdown,
        locationLabel: body.request!.locationLabel,
        preferredTime: body.request!.preferredTime,
      })),
      excluded: result.excluded.map((e) => ({
        partnerId: e.partner.id,
        displayName: e.partner.displayName,
        serviceName: e.service?.name ?? null,
        exclusionReason: e.exclusionReason,
        scoreBreakdown: e.scoreBreakdown,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Match failed.";
    const status = message.includes("disabled in production") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
