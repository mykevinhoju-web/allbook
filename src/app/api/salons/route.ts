import { NextResponse } from "next/server";

import { getSalons } from "@/features/salon/getSalons";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") ?? undefined;
  const service = searchParams.get("service") ?? undefined;

  const supabase = await createClient();
  const { salons, error } = await getSalons(supabase, { location, service });

  if (error) {
    return NextResponse.json(
      { salons: [], error },
      { status: 500 },
    );
  }

  return NextResponse.json({ salons, error: null });
}
