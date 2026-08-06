import { NextResponse } from "next/server";

import { searchSalons } from "@/features/search/searchSalons";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const result = await searchSalons(supabase, {
    location: searchParams.get("location") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    radiusKm: searchParams.get("radius") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
  });

  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
