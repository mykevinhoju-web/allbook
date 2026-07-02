import { createClient } from "@supabase/supabase-js";

import {
  TENANT_ENV,
  TENANT_SLUG_COOKIE,
  TENANT_SLUG_HEADER,
} from "@/features/tenants/constants";
import { resolveTenantBySlug } from "@/features/tenants/server/resolve-tenant";
import type { Tenant } from "@/features/tenants/types";
import {
  isPlatformHost,
} from "@/features/tenants/utils/resolve-host";
import { resolveTenantSlugFromHost } from "@/features/tenants/utils/resolve-slug";
import type { Database } from "@/types/database";

function resolveTenantSlugFromEnvOrNull(): string | null {
  return (
    process.env[TENANT_ENV.slug] ??
    process.env[TENANT_ENV.publicSlug] ??
    null
  );
}

export function resolveTenantSlugFromApiRequest(
  request: Request,
): string | null {
  const host = request.headers.get("host") ?? "";

  if (isPlatformHost(host)) {
    return null;
  }

  const headerSlug = request.headers.get(TENANT_SLUG_HEADER);
  if (headerSlug) {
    return headerSlug;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TENANT_SLUG_COOKIE}=([^;]+)`),
  );
  if (cookieMatch?.[1]) {
    return decodeURIComponent(cookieMatch[1]);
  }

  return (
    resolveTenantSlugFromHost(host) ?? resolveTenantSlugFromEnvOrNull()
  );
}

export async function requireTenantFromRequest(
  request: Request,
): Promise<Tenant> {
  const slug = resolveTenantSlugFromApiRequest(request);

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

export function createServiceSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
