/**
 * AllBook platform-level configuration.
 * Tenant-specific branding is resolved via TenantProvider — never hardcode tenant names here.
 */
export const platformConfig = {
  name: "AllBook",
  productName: "AllBook Platform",
  description: "Multi-tenant wellness and beauty booking platform.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/** @deprecated Use platformConfig or useTenant() for tenant branding. */
export const siteConfig = platformConfig;
