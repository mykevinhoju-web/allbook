import { unstable_cache } from "next/cache";

import { createServiceSupabase } from "@/lib/supabase/service";

import { TENANT_ENV } from "../constants";
import type { Tenant } from "../types";
import { buildLogoInitials } from "../utils/resolve-slug";

function buildTenantFromEnv(slug: string): Tenant {
  const displayName =
    process.env[TENANT_ENV.displayName] ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const tagline =
    process.env[TENANT_ENV.tagline] ??
    "Book wellness and beauty services with ease.";

  return {
    id: "00000000-0000-0000-0000-000000000000",
    slug,
    name: displayName,
    branding: {
      displayName,
      tagline,
      logoUrl: null,
      logoInitials: buildLogoInitials(displayName),
    },
    settings: {
      timezone: "Australia/Sydney",
      currency: "AUD",
      locale: "en-AU",
    },
    isActive: true,
  };
}

function mapRowToTenant(row: {
  id: string;
  slug: string;
  name: string;
  display_name: string;
  tagline: string | null;
  logo_url: string | null;
  timezone: string;
  currency: string;
  locale: string;
  is_active: boolean;
}): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    branding: {
      displayName: row.display_name,
      tagline: row.tagline ?? "",
      logoUrl: row.logo_url,
      logoInitials: buildLogoInitials(row.display_name),
    },
    settings: {
      timezone: row.timezone,
      currency: row.currency,
      locale: row.locale,
    },
    isActive: row.is_active,
  };
}

async function loadTenantBySlug(slug: string): Promise<Tenant> {
  try {
    // Service client avoids cookie-bound SSR clients and is cache-safe.
    const supabase = createServiceSupabase();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        "id, slug, name, display_name, tagline, logo_url, timezone, currency, locale, is_active",
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      return mapRowToTenant(data);
    }
  } catch {
    // Supabase not configured or tenants table not migrated yet.
  }

  return buildTenantFromEnv(slug);
}

/**
 * Loads tenant by slug from the database (cached ~5 minutes on the server).
 * Falls back to environment-driven config when DB is unavailable (dev/bootstrap).
 */
export async function resolveTenantBySlug(slug: string): Promise<Tenant> {
  return unstable_cache(
    async () => loadTenantBySlug(slug),
    ["tenant-by-slug", slug],
    { revalidate: 300, tags: [`tenant:${slug}`, "tenants"] },
  )();
}
