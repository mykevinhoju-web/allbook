import type { PortalThemeColors } from "@/features/portal-theme";
import type { PricingAdjustments } from "@/features/services/lib/pricing-adjustments";

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
  /** Shared chrome colors for admin / staff / room (hex). */
  portalTheme?: PortalThemeColors;
  /** Night surcharge + discount rules for booking prices. */
  pricingAdjustments?: PricingAdjustments;
  /** Per-tenant admin sidebar modules. Omit or `true` = visible; `false` = hidden. */
  adminModules?: {
    customers?: boolean;
    gallery?: boolean;
    settings?: boolean;
  };
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
