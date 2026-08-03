import type { MetadataRoute } from "next";

import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";

export default function robots(): MetadataRoute.Robots {
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
