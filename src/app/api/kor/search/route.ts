import { NextResponse } from "next/server";

import { runKoreanSearch } from "@/features/korean-search/run-korean-search";
import { isKoreanPlatformHost } from "@/features/tenants/utils/resolve-host";

export const runtime = "nodejs";

/**
 * POST /api/kor/search
 * Korean NL search for kor.allbook.com.au only.
 */
export async function POST(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (!isKoreanPlatformHost(host)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      query?: string;
      lat?: number;
      lng?: number;
      bookableOnly?: boolean;
    };
    const query = body.query?.trim() ?? "";
    if (!query) {
      return NextResponse.json({ error: "query is required." }, { status: 400 });
    }

    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const userOrigin =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
        ? { lat, lng }
        : null;

    const result = await runKoreanSearch(query, userOrigin, {
      bookableOnly: body.bookableOnly === true,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
