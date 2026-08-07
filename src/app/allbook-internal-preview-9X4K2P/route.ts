import { NextResponse } from "next/server";

import { isPrivatePreviewEnabled } from "@/features/private-preview";
import {
  PRIVATE_PREVIEW_ACCESS_COOKIE,
  getPreviewAccessCookieOptions,
  signPreviewAccessToken,
} from "@/features/private-preview/preview-access-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Secret Private Preview unlock.
 * Not linked from navigation or sitemap. Always noindex.
 * When Preview Mode is off → 404.
 */
export async function GET(request: Request) {
  if (!isPrivatePreviewEnabled()) {
    return new NextResponse(null, {
      status: 404,
      headers: {
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const token = await signPreviewAccessToken();
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(
    PRIVATE_PREVIEW_ACCESS_COOKIE,
    token,
    getPreviewAccessCookieOptions(),
  );
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
