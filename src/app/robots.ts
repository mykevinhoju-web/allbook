import type { MetadataRoute } from "next";

import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";
import { isPrivatePreviewEnabled } from "@/features/private-preview";

export default function robots(): MetadataRoute.Robots {
  if (isPrivatePreviewEnabled()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      host: PLATFORM_SITE_URL,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/platform", "/staff", "/room", "/api"],
    },
    sitemap: `${PLATFORM_SITE_URL}/sitemap.xml`,
    host: PLATFORM_SITE_URL,
  };
}
