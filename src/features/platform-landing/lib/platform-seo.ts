/**
 * SEO + marketing copy for the AllBook platform apex (allbook.com.au).
 * Aimed at Australian service businesses, including Korean, Chinese, and Japanese-owned shops.
 */
export const PLATFORM_SITE_URL = "https://allbook.com.au";

export const platformSeo = {
  title:
    "AllBook | Online Booking Software for Australian Service Businesses",
  titleTemplate: "%s | AllBook",
  description:
    "AllBook is customisable online booking software for Australian service businesses — including Korean, Chinese, and Japanese-owned spas, salons, clinics, and more. Take bookings, deposits, and grow with one simple platform built for any industry.",
  keywords: [
    "online booking software Australia",
    "booking system for Korean businesses Australia",
    "booking system for Chinese businesses Australia",
    "booking system for Japanese businesses Australia",
    "호주 예약 시스템",
    "호주 한국 미용실 예약",
    "澳大利亚预约系统",
    "オーストラリア予約システム",
    "day spa booking software",
    "salon booking Australia",
    "customisable booking platform",
    "Stripe booking deposits Australia",
    "appointment booking software Sydney Melbourne Brisbane",
    "AllBook",
  ],
  ogImage: `${PLATFORM_SITE_URL}/brand/allbook-logo-vertical.png`,
  locale: "en_AU",
  alternateLocale: ["ko_AU", "zh_AU", "ja_AU"],
} as const;

export function buildPlatformJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${PLATFORM_SITE_URL}/#organization`,
        name: "AllBook",
        url: PLATFORM_SITE_URL,
        logo: `${PLATFORM_SITE_URL}/brand/allbook-mark.png`,
        description: platformSeo.description,
        areaServed: {
          "@type": "Country",
          name: "Australia",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          availableLanguage: ["English", "Korean", "Chinese", "Japanese"],
          areaServed: "AU",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${PLATFORM_SITE_URL}/#website`,
        url: PLATFORM_SITE_URL,
        name: "AllBook",
        description: platformSeo.description,
        publisher: { "@id": `${PLATFORM_SITE_URL}/#organization` },
        inLanguage: ["en-AU", "ko", "zh", "ja"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${PLATFORM_SITE_URL}/#software`,
        name: "AllBook",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: PLATFORM_SITE_URL,
        description: platformSeo.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "AUD",
          description: "Free trial available",
        },
        featureList: [
          "Online booking",
          "Deposits via Stripe",
          "Staff and room scheduling",
          "Custom branding",
          "Works for any service business",
          "Korean, Chinese, Japanese and English friendly",
        ],
        audience: {
          "@type": "BusinessAudience",
          audienceType:
            "Australian service businesses including Korean, Chinese, and Japanese-owned shops",
        },
      },
    ],
  };
}
