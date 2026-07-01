import type { NextRequest } from "next/server";

import { TENANT_ENV, TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "../constants";
import {
  isPlatformHost,
  normalizeHostname,
} from "./resolve-host";

/**
 * Resolves tenant slug from request context.
 * Priority: middleware header → cookie → subdomain → environment variable (dev only).
 * Platform hosts (allbook.com.au, localhost) return null — no tenant context.
 */
export function resolveTenantSlugFromRequest(
  request: NextRequest,
): string | null {
  const host = request.headers.get("host") ?? request.nextUrl.host;

  if (isPlatformHost(host)) {
    return null;
  }

  const headerSlug = request.headers.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return headerSlug;
  }

  const cookieSlug = request.cookies.get(TENANT_SLUG_COOKIE)?.value;
  if (cookieSlug) {
    return cookieSlug;
  }

  const subdomainSlug = resolveTenantSlugFromHost(host);
  if (subdomainSlug) {
    return subdomainSlug;
  }

  return resolveTenantSlugFromEnvOrNull();
}

export function resolveTenantSlugFromHost(host: string): string | null {
  const hostname = normalizeHostname(host);

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

function resolveTenantSlugFromEnvOrNull(): string | null {
  const slug =
    process.env[TENANT_ENV.slug] ?? process.env[TENANT_ENV.publicSlug];

  return slug ?? null;
}

export function buildLogoInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
