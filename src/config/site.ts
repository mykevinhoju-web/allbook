/**
 * AllBook platform-level configuration.
 * Tenant-specific branding is resolved via TenantProvider — never hardcode tenant names here.
 */
export const platformConfig = {
  name: "AllBook",
  productName: "AllBook Platform",
  description:
    "Customisable online booking software for Australian service businesses — including Korean, Chinese, and Japanese-owned spas, salons, clinics, and any industry.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://allbook.com.au",
} as const;

/** @deprecated Use platformConfig or useTenant() for tenant branding. */
export const siteConfig = platformConfig;
