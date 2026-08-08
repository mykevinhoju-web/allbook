import { NextResponse } from "next/server";

import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const result = await searchSalons(supabase, {
    location: searchParams.get("location") ?? undefined,
    latitude: searchParams.get("lat") ?? undefined,
    longitude: searchParams.get("lng") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    suburb: searchParams.get("suburb") ?? undefined,
    radiusKm: searchParams.get("radius") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    minRating: searchParams.get("rating") ?? undefined,
    verifiedOnly: searchParams.get("verified") ?? undefined,
    openNow: searchParams.get("open") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
