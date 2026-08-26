/**
 * Custom apex/www domains → tenant slug.
 * Keep in sync with:
 * - Vercel project domains
 * - tenants.primary_domain in Supabase
 */
export const TENANT_CUSTOM_DOMAINS: Record<string, string> = {
  "everwellmassage.com.au": "everwellmassage",
  "www.everwellmassage.com.au": "everwellmassage",
};

export function resolveTenantSlugFromCustomDomain(
  hostname: string,
): string | null {
  const normalized = hostname.split(":")[0]?.toLowerCase() ?? "";
  return TENANT_CUSTOM_DOMAINS[normalized] ?? null;
}

/** Preferred public origin for a tenant (custom domain when configured). */
export function getTenantCustomOrigin(slug: string): string | null {
  for (const [domain, tenantSlug] of Object.entries(TENANT_CUSTOM_DOMAINS)) {
    if (tenantSlug === slug && !domain.startsWith("www.")) {
      return `https://${domain}`;
    }
  }
  return null;
}
