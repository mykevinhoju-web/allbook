import {
  TENANT_ENV,
  TENANT_SLUG_COOKIE,
} from "@/features/tenants/constants";
import { resolveTenantBySlug } from "@/features/tenants/server/resolve-tenant";
import type { Tenant } from "@/features/tenants/types";
import { resolveDevTenantSlugFromEnv } from "@/features/tenants/utils/dev-tenant";
import { isPlatformHost } from "@/features/tenants/utils/resolve-host";
import { resolveTenantSlugFromHost } from "@/features/tenants/utils/resolve-slug";
import { verifyTenantSlugToken } from "@/features/tenants/utils/tenant-slug-token";
import { createServiceSupabase } from "@/lib/supabase/service";

export { createServiceSupabase };

function resolveTenantSlugFromEnvOrNull(): string | null {
  return (
    process.env[TENANT_ENV.slug] ??
    process.env[TENANT_ENV.publicSlug] ??
    null
  );
}

/**
 * Resolve tenant slug from verified sources only:
 * 1) hostname subdomain mapping
 * 2) signed tenant cookie (set by middleware after host/path verify)
 * 3) local env override (non-platform or platform-dev)
 *
 * Never trusts client `x-tenant-slug`.
 */
export async function resolveTenantSlugFromApiRequest(
  request: Request,
): Promise<string | null> {
  const host = request.headers.get("host") ?? "";

  const fromHost = resolveTenantSlugFromHost(host);
  if (fromHost) {
    return fromHost;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TENANT_SLUG_COOKIE}=([^;]+)`),
  );
  const rawCookie = cookieMatch?.[1]
    ? decodeURIComponent(cookieMatch[1])
    : null;
  const verifiedCookie = await verifyTenantSlugToken(rawCookie);
  if (verifiedCookie) {
    return verifiedCookie;
  }

  if (isPlatformHost(host)) {
    return resolveDevTenantSlugFromEnv();
  }

  return resolveTenantSlugFromEnvOrNull();
}

export async function requireTenantFromRequest(
  request: Request,
): Promise<Tenant> {
  const slug = await resolveTenantSlugFromApiRequest(request);

  if (!slug) {
    throw new TenantContextError("Tenant context is required.", 400);
  }

  return resolveTenantBySlug(slug);
}

export class TenantContextError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "TenantContextError";
  }
}
