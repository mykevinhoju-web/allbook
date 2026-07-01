import { TENANT_ENV } from "@/features/tenants/constants";
import { getTenantPublicUrl } from "@/features/tenants/utils/resolve-host";

export interface FeaturedTenant {
  slug: string;
  name: string;
  description: string;
  publicUrl: string;
  adminUrl: string;
}

export function getFeaturedTenants(): FeaturedTenant[] {
  const slug =
    process.env[TENANT_ENV.publicSlug] ??
    process.env[TENANT_ENV.slug] ??
    "dayspa";
  const name =
    process.env[TENANT_ENV.displayName] ??
    slug
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const description =
    process.env[TENANT_ENV.tagline] ??
    "Book wellness and beauty services with ease.";

  return [
    {
      slug,
      name,
      description,
      publicUrl: getTenantPublicUrl(slug),
      adminUrl: `${getTenantPublicUrl(slug)}/admin`,
    },
  ];
}

export function getPrimaryTenantSlug(): string {
  return (
    process.env[TENANT_ENV.publicSlug] ??
    process.env[TENANT_ENV.slug] ??
    "dayspa"
  );
}
