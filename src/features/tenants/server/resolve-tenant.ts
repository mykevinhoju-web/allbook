import { unstable_cache } from "next/cache";

import { parsePortalTheme } from "@/features/portal-theme";
import { createServiceSupabase } from "@/lib/supabase/service";

import { TENANT_ENV } from "../constants";
import type { Tenant, TenantSettings } from "../types";
import { buildLogoInitials } from "../utils/resolve-slug";

const devTenantBySlug = new Map<string, Tenant>();

/** Drop in-memory tenant cache (dev) after settings like portalTheme change. */
export function invalidateDevTenantCache(slug?: string) {
  if (slug) {
    devTenantBySlug.delete(slug);
    return;
  }
  devTenantBySlug.clear();
}

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

function parseAdminModules(
  settings: unknown,
): TenantSettings["adminModules"] | undefined {
  if (!settings || typeof settings !== "object") return undefined;

  const raw = (settings as { adminModules?: unknown }).adminModules;
  if (!raw || typeof raw !== "object") return undefined;

  const modules = raw as Record<string, unknown>;
  const parsed: NonNullable<TenantSettings["adminModules"]> = {};

  if (typeof modules.customers === "boolean") {
    parsed.customers = modules.customers;
  }
  if (typeof modules.gallery === "boolean") {
    parsed.gallery = modules.gallery;
  }
  if (typeof modules.settings === "boolean") {
    parsed.settings = modules.settings;
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

function parsePortalThemeFromSettings(
  settings: unknown,
): TenantSettings["portalTheme"] | undefined {
  if (!settings || typeof settings !== "object") return undefined;
  return parsePortalTheme(
    (settings as { portalTheme?: unknown }).portalTheme,
  );
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
  settings?: unknown;
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
      portalTheme: parsePortalThemeFromSettings(row.settings),
      adminModules: parseAdminModules(row.settings),
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
        "id, slug, name, display_name, tagline, logo_url, timezone, currency, locale, is_active, settings",
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
  if (process.env.NODE_ENV === "development") {
    const cached = devTenantBySlug.get(slug);
    if (cached) {
      return cached;
    }

    const tenant = await loadTenantBySlug(slug);
    devTenantBySlug.set(slug, tenant);
    return tenant;
  }

  return unstable_cache(
    async () => loadTenantBySlug(slug),
    ["tenant-by-slug", slug],
    { revalidate: 300, tags: [`tenant:${slug}`, "tenants"] },
  )();
}
