import type { MetadataRoute } from "next";

import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: PLATFORM_SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${PLATFORM_SITE_URL}/booking`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
