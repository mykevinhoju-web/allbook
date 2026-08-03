import type { Metadata } from "next";

import { PlatformLandingPage, TenantHomePage } from "@/components/common";
import {
  PLATFORM_SITE_URL,
  buildPlatformJsonLd,
  platformSeo,
} from "@/features/platform-landing/lib/platform-seo";
import { getTenantOptional } from "@/features/tenants/server";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();

  if (tenant) {
    return {
      title: tenant.branding.displayName,
      description: tenant.branding.tagline,
    };
  }

  return {
    title: {
      absolute: platformSeo.title,
    },
    description: platformSeo.description,
    keywords: [...platformSeo.keywords],
    applicationName: "AllBook",
    authors: [{ name: "AllBook" }],
    creator: "AllBook",
    publisher: "AllBook",
    category: "business software",
    alternates: {
      canonical: PLATFORM_SITE_URL,
      languages: {
        "en-AU": PLATFORM_SITE_URL,
        ko: PLATFORM_SITE_URL,
        zh: PLATFORM_SITE_URL,
        ja: PLATFORM_SITE_URL,
      },
    },
    openGraph: {
      type: "website",
      locale: platformSeo.locale,
      alternateLocale: [...platformSeo.alternateLocale],
      url: PLATFORM_SITE_URL,
      siteName: "AllBook",
      title: platformSeo.title,
      description: platformSeo.description,
      images: [
        {
          url: platformSeo.ogImage,
          width: 960,
          height: 900,
          alt: "AllBook — online booking software for Australian service businesses",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: platformSeo.title,
      description: platformSeo.description,
      images: [platformSeo.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export default async function HomePage() {
  const tenant = await getTenantOptional();

  if (!tenant) {
    const jsonLd = buildPlatformJsonLd();

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PlatformLandingPage />
      </>
    );
  }

  return <TenantHomePage tenant={tenant} />;
}
