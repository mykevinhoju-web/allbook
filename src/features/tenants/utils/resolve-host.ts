import {
  getTenantCustomOrigin,
  resolveTenantSlugFromCustomDomain,
} from "@/config/tenant-custom-domains";

const PLATFORM_APEX_HOSTS = new Set([
  "allbook.com.au",
  "www.allbook.com.au",
  "kor.allbook.com.au",
]);

const LOCAL_PLATFORM_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeHostname(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function isKoreanPlatformHost(host: string): boolean {
  return normalizeHostname(host) === "kor.allbook.com.au";
}

export function isPlatformHost(host: string): boolean {
  const hostname = normalizeHostname(host);

  if (PLATFORM_APEX_HOSTS.has(hostname)) {
    return true;
  }

  if (LOCAL_PLATFORM_HOSTS.has(hostname)) {
    return true;
  }

  return false;
}

export function isTenantSubdomainHost(host: string): boolean {
  const hostname = normalizeHostname(host);

  if (isPlatformHost(host)) {
    return false;
  }

  return (
    /^[a-z0-9-]+\.allbook\.com\.au$/.test(hostname) ||
    /^[a-z0-9-]+\.localhost$/.test(hostname)
  );
}

/** True when the host maps to a tenant (subdomain or custom domain). */
export function isTenantHost(host: string): boolean {
  if (isPlatformHost(host)) {
    return false;
  }
  const hostname = normalizeHostname(host);
  if (resolveTenantSlugFromCustomDomain(hostname)) {
    return true;
  }
  return isTenantSubdomainHost(host);
}

function getPlatformOrigin(): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://allbook.com.au";
}

/** Public URL for a tenant: custom domain when set, else allbook.com.au/{slug}. */
export function getTenantPublicUrl(slug: string): string {
  const custom = getTenantCustomOrigin(slug);
  if (custom) {
    return custom;
  }
  return `${getPlatformOrigin()}/${slug}`;
}

/** Admin URL for a tenant (custom domain /admin when configured). */
export function getTenantAdminUrl(slug: string): string {
  return `${getTenantPublicUrl(slug)}/admin`;
}

/** Booking URL for a tenant (custom domain /booking when configured). */
export function getTenantBookingUrl(slug: string): string {
  return `${getTenantPublicUrl(slug)}/booking`;
}
