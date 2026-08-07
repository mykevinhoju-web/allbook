/**
 * Business Settings Engine — permanent configuration framework.
 *
 * Hierarchy: Platform Default → Business → Service → Staff (future) → Booking (future).
 * Booking / Payments / Cancellation / Refunds remain owned by the frozen
 * Booking & Payment Policy Engine; this layer provides unified groups, flags,
 * permissions, and integration slots without redesigning those modules.
 */

export type SettingsGroupKey =
  | "business"
  | "booking"
  | "payments"
  | "cancellation"
  | "refunds"
  | "services"
  | "staff"
  | "notifications"
  | "calendar"
  | "marketing"
  | "loyalty"
  | "gift_cards"
  | "reviews"
  | "marketplace"
  | "privacy"
  | "security"
  | "integrations"
  | "features";

export type SettingsLevel = "platform" | "business" | "service" | "staff" | "booking";

export type SettingsRole = "owner" | "admin" | "staff" | "platform_admin";

export type FeatureFlagKey =
  | "online_booking"
  | "deposits"
  | "full_payment"
  | "card_hold"
  | "gift_cards"
  | "loyalty"
  | "memberships"
  | "coupons"
  | "reviews"
  | "waitlist"
  | "sms"
  | "email"
  | "push_notifications"
  | "marketplace_visibility"
  | "featured_listing"
  | "sponsored_listing";

export type IntegrationProvider =
  | "stripe"
  | "square"
  | "tyro"
  | "xero"
  | "myob"
  | "google_calendar"
  | "outlook"
  | "apple_calendar"
  | "google_business"
  | "meta"
  | "instagram";

export type IntegrationStatus =
  | "disconnected"
  | "pending"
  | "connected"
  | "error";

export type SettingValueType = "boolean" | "string" | "number" | "json" | "enum";

export type SettingDefinition = {
  group: SettingsGroupKey;
  key: string;
  label: string;
  description?: string;
  valueType: SettingValueType;
  enumValues?: string[];
  /** Owned by frozen Booking & Payment Policy Engine — UI delegates, store is mirror/metadata only. */
  delegatedToPolicyEngine?: boolean;
  defaultValue: unknown;
};

export type SettingEntry = {
  group: SettingsGroupKey;
  key: string;
  value: unknown;
  level: SettingsLevel;
  scopeId: string | null;
  source: "platform" | "business" | "service" | "staff" | "booking" | "default";
};

export type ResolvedSettings = {
  salonId: string;
  group: SettingsGroupKey;
  values: Record<string, unknown>;
  entries: SettingEntry[];
  /** Which level won for each key */
  resolvedFrom: Record<string, SettingsLevel | "default">;
};

export type FeatureFlagState = {
  key: FeatureFlagKey;
  enabled: boolean;
  config: Record<string, unknown>;
};

export type IntegrationSlot = {
  provider: IntegrationProvider;
  status: IntegrationStatus;
  config: Record<string, unknown>;
  connectedAt: string | null;
};

export type GroupPermission = {
  role: SettingsRole;
  group: SettingsGroupKey;
  canRead: boolean;
  canWrite: boolean;
};

export type ResolveSettingsInput = {
  salonId: string;
  group: SettingsGroupKey;
  serviceId?: string | null;
  staffId?: string | null;
  bookingId?: string | null;
};
