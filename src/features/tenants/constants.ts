/** HTTP header set by middleware with the resolved tenant slug. */
export const TENANT_SLUG_HEADER = "x-tenant-slug";

/** Cookie name for persisting tenant context on the client. */
export const TENANT_SLUG_COOKIE = "tenant_slug";

/** Environment variable keys — tenant identity must come from env or DB, never hardcoded in code. */
export const TENANT_ENV = {
  slug: "TENANT_SLUG",
  publicSlug: "NEXT_PUBLIC_TENANT_SLUG",
  displayName: "NEXT_PUBLIC_TENANT_DISPLAY_NAME",
  tagline: "NEXT_PUBLIC_TENANT_TAGLINE",
} as const;
