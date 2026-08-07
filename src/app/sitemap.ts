import type { MetadataRoute } from "next";

import { PLATFORM_SITE_URL } from "@/features/platform-landing/lib/platform-seo";
import { isPrivatePreviewEnabled } from "@/features/private-preview";

export default function sitemap(): MetadataRoute.Sitemap {
  // Private Preview — do not advertise Marketplace URLs to crawlers.
  // Unlock path is never listed.
  if (isPrivatePreviewEnabled()) {
    return [];
  }

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
