export interface TenantBranding {
  displayName: string;
  tagline: string;
  logoUrl: string | null;
  logoInitials: string;
}

export interface TenantSettings {
  timezone: string;
  currency: string;
  locale: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  branding: TenantBranding;
  settings: TenantSettings;
  isActive: boolean;
}

export type TenantSlug = string;
