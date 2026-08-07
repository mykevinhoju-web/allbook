import { NextResponse } from "next/server";

/**
 * Proxy Google Places Photo media so API keys never land in public salon_images URLs.
 * GET /api/places/photo?name=places%2F...%2Fphotos%2F...&w=1200
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim();
  const width = Number(searchParams.get("w") ?? "1200");

  if (!name || !name.startsWith("places/")) {
    return NextResponse.json({ error: "Invalid photo name." }, { status: 400 });
  }

  const key =
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!key) {
    return NextResponse.json(
      { error: "Places API key not configured." },
      { status: 503 },
    );
  }

  const maxWidthPx = Number.isFinite(width)
    ? Math.min(4800, Math.max(100, width))
    : 1200;

  const upstream = new URL(`https://places.googleapis.com/v1/${name}/media`);
  upstream.searchParams.set("maxWidthPx", String(maxWidthPx));
  upstream.searchParams.set("key", key);

  const response = await fetch(upstream.toString(), { redirect: "follow" });
  if (!response.ok) {
    return NextResponse.json(
      { error: `Photo fetch failed (${response.status}).` },
      { status: 502 },
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const buffer = await response.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
    },
  });
}
