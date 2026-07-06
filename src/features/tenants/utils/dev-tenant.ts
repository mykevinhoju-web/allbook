import { TENANT_ENV } from "../constants";

/** Dev-only tenant slug from .env.local — lets localhost:3000 work without subdomains. */
export function resolveDevTenantSlugFromEnv(): string | null {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    process.env[TENANT_ENV.slug] ??
    process.env[TENANT_ENV.publicSlug] ??
    null
  );
}
