import type { NextRequest } from "next/server";

import { TENANT_ENV, TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "../constants";

/**
 * Resolves tenant slug from request context.
 * Priority: middleware header → cookie → subdomain → environment variable.
 */
export function resolveTenantSlugFromRequest(request: NextRequest): string {
  const headerSlug = request.headers.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return headerSlug;
  }

  const cookieSlug = request.cookies.get(TENANT_SLUG_COOKIE)?.value;
  if (cookieSlug) {
    return cookieSlug;
  }

  const subdomainSlug = resolveTenantSlugFromHost(
    request.headers.get("host") ?? request.nextUrl.host,
  );
  if (subdomainSlug) {
    return subdomainSlug;
  }

  return resolveTenantSlugFromEnv();
}

export function resolveTenantSlugFromHost(host: string): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";

  // {tenant}.allbook.com.au
  const platformMatch = hostname.match(/^([a-z0-9-]+)\.allbook\.com\.au$/);
  if (platformMatch?.[1] && platformMatch[1] !== "www") {
    return platformMatch[1];
  }

  // {tenant}.localhost for local multi-tenant dev
  const localMatch = hostname.match(/^([a-z0-9-]+)\.localhost$/);
  if (localMatch?.[1]) {
    return localMatch[1];
  }

  return null;
}

export function resolveTenantSlugFromEnv(): string {
  return (
    process.env[TENANT_ENV.slug] ??
    process.env[TENANT_ENV.publicSlug] ??
    "default"
  );
}

export function buildLogoInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
