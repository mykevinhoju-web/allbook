import { NextResponse } from "next/server";

import { getSalonPageData } from "@/features/salon";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const result = await getSalonPageData(supabase, id);

  if (result.status === "not_found") {
    return NextResponse.json(
      { error: "Salon not found", data: null },
      { status: 404 },
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      { error: result.error, data: null },
      { status: 500 },
    );
  }

  return NextResponse.json({ error: null, data: result.data });
}
