const PLATFORM_APEX_HOSTS = new Set(["allbook.com.au", "www.allbook.com.au"]);

const LOCAL_PLATFORM_HOSTS = new Set(["localhost", "127.0.0.1"]);

export function normalizeHostname(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
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

function getPlatformOrigin(): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  return "https://allbook.com.au";
}

/** Public URL for a tenant: allbook.com.au/{slug} (path-based). */
export function getTenantPublicUrl(slug: string): string {
  return `${getPlatformOrigin()}/${slug}`;
}

/** Admin URL for a tenant: allbook.com.au/{slug}/admin */
export function getTenantAdminUrl(slug: string): string {
  return `${getTenantPublicUrl(slug)}/admin`;
}
