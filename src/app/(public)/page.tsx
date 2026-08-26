import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  PlatformLandingPage,
  SiteFooter,
  TenantHomePage,
} from "@/components/common";
import { KoreanPlatformLanding } from "@/features/platform-landing/components/korean-platform-landing";
import {
  PLATFORM_SITE_URL,
  buildPlatformJsonLd,
  platformSeo,
} from "@/features/platform-landing/lib/platform-seo";
import {
  canAccessMarketplacePreview,
  getIsPlatformAdmin,
} from "@/features/private-preview/access";
import {
  PrivatePreviewLanding,
  isPrivatePreviewEnabled,
} from "@/features/private-preview";
import { EverLandingFonts, EverUnderConstruction, isEverTenant } from "@/features/ever";
import { getTenantOptional } from "@/features/tenants/server";
import { isKoreanPlatformHost } from "@/features/tenants/utils/resolve-host";

async function getRequestHost() {
  const headerStore = await headers();
  return headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();
  const host = await getRequestHost();
  const preview = isPrivatePreviewEnabled();

  if (!tenant && isKoreanPlatformHost(host)) {
    return {
      title: { absolute: "AllBook" },
      description: "무엇을 찾고 계세요?",
      robots: { index: false, follow: false },
    };
  }

  if (tenant) {
    if (isEverTenant(tenant.slug)) {
      return {
        title: "Everwell Massage",
        description: "Under construction — please check back soon.",
        robots: { index: false, follow: false },
      };
    }
    return {
      title: tenant.branding.displayName,
      description: tenant.branding.tagline,
      robots: preview
        ? { index: false, follow: false }
        : { index: true, follow: true },
    };
  }

  if (preview) {
    const allowMarketplace = await canAccessMarketplacePreview();
    if (!allowMarketplace) {
      return {
        title: { absolute: "AllBook — Private Preview" },
        description: "AllBook Private Preview — Launching Soon",
        robots: { index: false, follow: false },
      };
    }
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
    robots: preview
      ? { index: false, follow: false }
      : {
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
  const host = await getRequestHost();

  if (!tenant && isKoreanPlatformHost(host)) {
    return <KoreanPlatformLanding />;
  }

  if (!tenant) {
    if (isPrivatePreviewEnabled()) {
      const allowMarketplace = await canAccessMarketplacePreview();
      if (!allowMarketplace) {
        return <PrivatePreviewLanding isPlatformAdmin={false} />;
      }
      // Platform admin: real Marketplace + footer Documentation link.
      const showDocumentation = await getIsPlatformAdmin();
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(buildPlatformJsonLd()),
            }}
          />
          <PlatformLandingPage />
          <SiteFooter showDocumentation={showDocumentation} />
        </>
      );
    }

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

  if (isEverTenant(tenant.slug)) {
    return (
      <EverLandingFonts>
        <EverUnderConstruction />
      </EverLandingFonts>
    );
  }

  return <TenantHomePage tenant={tenant} />;
}
