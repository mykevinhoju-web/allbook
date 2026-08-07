import type {
  FeatureFlagKey,
  SettingDefinition,
  SettingsGroupKey,
  SettingsRole,
} from "./types";

export const SETTINGS_GROUPS: Array<{
  key: SettingsGroupKey;
  label: string;
  description: string;
  /** Opens frozen Booking & Payment Policy Engine panel */
  policyEngine?: boolean;
}> = [
  {
    key: "business",
    label: "Business",
    description: "Public profile preferences and locale defaults.",
  },
  {
    key: "booking",
    label: "Booking",
    description: "Online booking behaviour — managed by Policy Engine.",
    policyEngine: true,
  },
  {
    key: "payments",
    label: "Payments",
    description: "Payment modes — managed by Policy Engine (no gateways yet).",
    policyEngine: true,
  },
  {
    key: "cancellation",
    label: "Cancellation",
    description: "Cancellation windows — managed by Policy Engine.",
    policyEngine: true,
  },
  {
    key: "refunds",
    label: "Refunds",
    description: "Refund behaviour — managed by Policy Engine.",
    policyEngine: true,
  },
  {
    key: "services",
    label: "Services",
    description: "Catalog defaults for new services.",
  },
  {
    key: "staff",
    label: "Staff",
    description: "Staff booking and visibility defaults.",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Email, SMS, and push preferences.",
  },
  {
    key: "calendar",
    label: "Calendar",
    description: "Calendar sync and timezone preferences.",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Campaign and promo defaults.",
  },
  {
    key: "loyalty",
    label: "Loyalty",
    description: "Loyalty programme (feature-flagged).",
  },
  {
    key: "gift_cards",
    label: "Gift Cards",
    description: "Gift card programme (feature-flagged).",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Review collection and display.",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    description: "AllBook marketplace listing preferences.",
  },
  {
    key: "privacy",
    label: "Privacy",
    description: "Customer data and consent defaults.",
  },
  {
    key: "security",
    label: "Security",
    description: "Access and session preferences.",
  },
  {
    key: "integrations",
    label: "Integrations",
    description: "Future provider slots (Stripe, Square, calendars, …).",
  },
  {
    key: "features",
    label: "Feature flags",
    description: "Enable or disable product capabilities.",
  },
];

export const FEATURE_FLAG_DEFINITIONS: Array<{
  key: FeatureFlagKey;
  label: string;
  description: string;
  defaultEnabled: boolean;
}> = [
  {
    key: "online_booking",
    label: "Online booking",
    description: "Accept appointments online.",
    defaultEnabled: true,
  },
  {
    key: "deposits",
    label: "Deposits",
    description: "Allow deposit payment modes (gateway later).",
    defaultEnabled: false,
  },
  {
    key: "full_payment",
    label: "Full payment",
    description: "Allow full prepayment modes (gateway later).",
    defaultEnabled: false,
  },
  {
    key: "card_hold",
    label: "Card hold",
    description: "Allow card-hold no-show protection (gateway later).",
    defaultEnabled: false,
  },
  {
    key: "gift_cards",
    label: "Gift cards",
    description: "Sell and redeem gift cards.",
    defaultEnabled: false,
  },
  {
    key: "loyalty",
    label: "Loyalty",
    description: "Loyalty points programme.",
    defaultEnabled: false,
  },
  {
    key: "memberships",
    label: "Memberships",
    description: "Membership packages.",
    defaultEnabled: false,
  },
  {
    key: "coupons",
    label: "Coupons",
    description: "Promo codes and coupons.",
    defaultEnabled: false,
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Collect and show customer reviews.",
    defaultEnabled: true,
  },
  {
    key: "waitlist",
    label: "Waitlist",
    description: "Waitlist for fully booked times.",
    defaultEnabled: false,
  },
  {
    key: "sms",
    label: "SMS",
    description: "SMS notifications.",
    defaultEnabled: false,
  },
  {
    key: "email",
    label: "Email",
    description: "Email notifications.",
    defaultEnabled: true,
  },
  {
    key: "push_notifications",
    label: "Push notifications",
    description: "Push alerts for owners and customers.",
    defaultEnabled: false,
  },
  {
    key: "marketplace_visibility",
    label: "Marketplace visibility",
    description: "Appear in AllBook marketplace search.",
    defaultEnabled: true,
  },
  {
    key: "featured_listing",
    label: "Featured listing",
    description: "Eligible for featured placement.",
    defaultEnabled: false,
  },
  {
    key: "sponsored_listing",
    label: "Sponsored listing",
    description: "Eligible for sponsored placement.",
    defaultEnabled: false,
  },
];

/** Registry — new features add definitions here; no structural redesign. */
export const SETTING_DEFINITIONS: SettingDefinition[] = [
  {
    group: "business",
    key: "timezone",
    label: "Timezone",
    valueType: "string",
    defaultValue: "Australia/Sydney",
  },
  {
    group: "business",
    key: "locale",
    label: "Locale",
    valueType: "string",
    defaultValue: "en-AU",
  },
  {
    group: "business",
    key: "currency",
    label: "Currency",
    valueType: "string",
    defaultValue: "AUD",
  },
  {
    group: "business",
    key: "accept_new_customers",
    label: "Accept new customers",
    valueType: "boolean",
    defaultValue: true,
  },
  // Policy-engine delegated keys (metadata pointers only — SoT is salon_booking_policies)
  {
    group: "booking",
    key: "managed_by",
    label: "Managed by",
    valueType: "string",
    defaultValue: "booking_policy_engine",
    delegatedToPolicyEngine: true,
  },
  {
    group: "payments",
    key: "managed_by",
    label: "Managed by",
    valueType: "string",
    defaultValue: "booking_policy_engine",
    delegatedToPolicyEngine: true,
  },
  {
    group: "cancellation",
    key: "managed_by",
    label: "Managed by",
    valueType: "string",
    defaultValue: "booking_policy_engine",
    delegatedToPolicyEngine: true,
  },
  {
    group: "refunds",
    key: "managed_by",
    label: "Managed by",
    valueType: "string",
    defaultValue: "booking_policy_engine",
    delegatedToPolicyEngine: true,
  },
  {
    group: "services",
    key: "default_duration_minutes",
    label: "Default service duration",
    valueType: "number",
    defaultValue: 60,
  },
  {
    group: "services",
    key: "default_booking_enabled",
    label: "New services bookable by default",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "staff",
    key: "default_booking_enabled",
    label: "New staff bookable by default",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "notifications",
    key: "email_booking_confirmation",
    label: "Email booking confirmation",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "notifications",
    key: "email_reminder",
    label: "Email appointment reminder",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "notifications",
    key: "sms_reminder",
    label: "SMS appointment reminder",
    valueType: "boolean",
    defaultValue: false,
  },
  {
    group: "calendar",
    key: "week_starts_on",
    label: "Week starts on",
    valueType: "enum",
    enumValues: ["monday", "sunday"],
    defaultValue: "monday",
  },
  {
    group: "calendar",
    key: "slot_interval_minutes",
    label: "Slot interval (minutes)",
    valueType: "number",
    defaultValue: 15,
  },
  {
    group: "marketing",
    key: "allow_promotions",
    label: "Allow promotions",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "loyalty",
    key: "points_per_dollar",
    label: "Points per dollar",
    valueType: "number",
    defaultValue: 1,
  },
  {
    group: "gift_cards",
    key: "allow_purchase",
    label: "Allow gift card purchase",
    valueType: "boolean",
    defaultValue: false,
  },
  {
    group: "reviews",
    key: "auto_request_after_hours",
    label: "Request review after (hours)",
    valueType: "number",
    defaultValue: 24,
  },
  {
    group: "reviews",
    key: "show_on_marketplace",
    label: "Show reviews on marketplace",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "marketplace",
    key: "listed",
    label: "Listed on marketplace",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "marketplace",
    key: "show_starting_price",
    label: "Show starting price",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "privacy",
    key: "share_analytics",
    label: "Share anonymised analytics",
    valueType: "boolean",
    defaultValue: true,
  },
  {
    group: "security",
    key: "require_2fa_for_owners",
    label: "Require 2FA for owners",
    valueType: "boolean",
    defaultValue: false,
  },
  {
    group: "integrations",
    key: "preferred_calendar",
    label: "Preferred calendar",
    valueType: "enum",
    enumValues: ["none", "google_calendar", "outlook", "apple_calendar"],
    defaultValue: "none",
  },
];

/** Default permission matrix — owners/admins write; staff read limited groups. */
export const DEFAULT_GROUP_PERMISSIONS: Array<{
  role: SettingsRole;
  group: SettingsGroupKey;
  canRead: boolean;
  canWrite: boolean;
}> = SETTINGS_GROUPS.flatMap((g) => {
  const rows: Array<{
    role: SettingsRole;
    group: SettingsGroupKey;
    canRead: boolean;
    canWrite: boolean;
  }> = [
    { role: "owner", group: g.key, canRead: true, canWrite: true },
    { role: "admin", group: g.key, canRead: true, canWrite: true },
    {
      role: "platform_admin",
      group: g.key,
      canRead: true,
      canWrite: true,
    },
  ];
  const staffWritable = new Set<SettingsGroupKey>([
    "calendar",
    "notifications",
  ]);
  const staffReadable = new Set<SettingsGroupKey>([
    "business",
    "booking",
    "services",
    "staff",
    "calendar",
    "notifications",
  ]);
  rows.push({
    role: "staff",
    group: g.key,
    canRead: staffReadable.has(g.key),
    canWrite: staffWritable.has(g.key),
  });
  return rows;
});

export function definitionsForGroup(
  group: SettingsGroupKey,
): SettingDefinition[] {
  return SETTING_DEFINITIONS.filter((d) => d.group === group);
}

export function isSettingsGroupKey(value: string): value is SettingsGroupKey {
  return SETTINGS_GROUPS.some((g) => g.key === value);
}
