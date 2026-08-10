import { NextResponse } from "next/server";

/**
 * @deprecated Keyword limits are per-salon (paid upgrade) via
 * PATCH /api/platform/businesses/[id] { ownerKeywordLimit }.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "Global keyword limit removed. Set ownerKeywordLimit per salon on /platform/businesses.",
      defaultOwnerKeywordLimit: 5,
    },
    { status: 410 },
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Global keyword limit removed. Set ownerKeywordLimit per salon on /platform/businesses.",
    },
    { status: 410 },
  );
}
