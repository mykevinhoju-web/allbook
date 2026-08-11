import { NextResponse } from "next/server";

import {
  assertMarketplaceDemoAllowed,
  getActiveRequestParser,
  matchExplanation,
  runMarketplaceMatch,
  summarizeNoMatches,
} from "@/features/marketplace-matching";
import { createServiceSupabase } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/search
 * Customer NL query → Demo Parser → Matching Engine (no AI).
 */
export async function POST(request: Request) {
  try {
    assertMarketplaceDemoAllowed();
    const body = (await request.json()) as {
      query?: string;
      persist?: boolean;
    };
    const query = body.query?.trim() ?? "";
    if (!query) {
      return NextResponse.json(
        { error: "query is required." },
        { status: 400 },
      );
    }

    const parser = getActiveRequestParser();
    const parsed = parser.parse(query);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          ok: false,
          parserId: parser.id,
          error: parsed.error,
          hints: parsed.hints,
        },
        { status: 422 },
      );
    }

    const supabase = createServiceSupabase();
    const result = await runMarketplaceMatch({
      supabase,
      request: parsed.request,
      persist: body.persist !== false,
      isDemo: true,
    });

    const matches = result.matches.map((m) => ({
      partnerId: m.partner.id,
      displayName: m.partner.displayName,
      bio: null as string | null,
      serviceName: m.service.name,
      categorySlug: m.service.categorySlug,
      priceCents: m.service.priceCents,
      pricingType: m.service.pricingType,
      score: m.score,
      scoreBreakdown: m.scoreBreakdown,
      explanations: matchExplanation(m.scoreBreakdown),
      locationLabel: parsed.request.locationLabel,
      preferredTime: parsed.request.preferredTime,
      preferredDate: parsed.request.preferredDate,
      detailPath: `/marketplace/partners/${m.partner.id}`,
    }));

    return NextResponse.json({
      ok: true,
      parserId: parser.id,
      parsed: {
        request: parsed.request,
        confidence: parsed.confidence,
        matchedPattern: parsed.matchedPattern,
        notes: parsed.notes,
      },
      requestId: result.requestId,
      matches,
      excluded: result.excluded.map((e) => ({
        partnerId: e.partner.id,
        displayName: e.partner.displayName,
        serviceName: e.service?.name ?? null,
        exclusionReason: e.exclusionReason,
      })),
      noMatchSummary:
        matches.length === 0 ? summarizeNoMatches(result) : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    const status = message.includes("disabled in production") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
