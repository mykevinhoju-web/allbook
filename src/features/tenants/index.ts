export { TENANT_ENV, TENANT_SLUG_COOKIE, TENANT_SLUG_HEADER } from "./constants";
export { TenantProvider, useOptionalTenant, useTenant } from "./context/tenant-provider";
export type { Tenant, TenantBranding, TenantSettings, TenantSlug } from "./types";
export {
  getTenantAdminUrl,
  getTenantPublicUrl,
  isPlatformHost,
  isTenantSubdomainHost,
  normalizeHostname,
} from "./utils/resolve-host";
export {
  buildLogoInitials,
  resolveTenantSlugFromEnv,
  resolveTenantSlugFromHost,
  resolveTenantSlugFromRequest,
} from "./utils/resolve-slug";
