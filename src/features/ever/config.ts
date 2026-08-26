/** Ever (Everwell Massage) — tenant slug and canonical site URL. */
export const EVER_TENANT_SLUG = "everwellmassage" as const;

export const EVER_SITE_URL = "https://everwellmassage.com.au";

export function isEverTenant(slug: string | null | undefined): slug is typeof EVER_TENANT_SLUG {
  return slug === EVER_TENANT_SLUG;
}
