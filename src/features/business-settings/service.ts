import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

import {
  DEFAULT_GROUP_PERMISSIONS,
  FEATURE_FLAG_DEFINITIONS,
  definitionsForGroup,
} from "./registry";
import { assertCanRead, assertCanWrite } from "./permissions";
import {
  asJson,
  buildDefaultBusinessSettings,
  buildDefaultFeatureFlags,
  fromJson,
  isFeatureFlagKey,
  resolveSettingsLayers,
} from "./resolve";
import type {
  FeatureFlagKey,
  FeatureFlagState,
  IntegrationProvider,
  IntegrationSlot,
  ResolvedSettings,
  SettingsGroupKey,
  SettingsRole,
} from "./types";

type AnySupabase = SupabaseClient<Database>;

async function seedPermissions(supabase: AnySupabase) {
  const rows = DEFAULT_GROUP_PERMISSIONS.map((p) => ({
    role: p.role,
    group_key: p.group,
    can_read: p.canRead,
    can_write: p.canWrite,
  }));
  await supabase.from("settings_group_permissions").upsert(rows, {
    onConflict: "role,group_key",
  });
}

async function seedPlatformDefaults(supabase: AnySupabase) {
  const rows = buildDefaultBusinessSettings().map((s) => ({
    group_key: s.group,
    setting_key: s.key,
    value: asJson(s.value),
    description: "Platform default",
  }));
  if (rows.length === 0) return;
  await supabase.from("platform_settings").upsert(rows, {
    onConflict: "group_key,setting_key",
  });
}

/**
 * Ensure salon has default settings + feature flags.
 * Safe on every create; does not touch Booking Policy Engine tables.
 */
export async function ensureDefaultSalonSettings(
  supabase: AnySupabase,
  salonId: string,
  actor = "system",
): Promise<void> {
  await seedPermissions(supabase);
  await seedPlatformDefaults(supabase);

  const { count } = await supabase
    .from("salon_settings")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("level", "business");

  if (!count) {
    const defaults = buildDefaultBusinessSettings();
    const now = new Date().toISOString();
    await supabase.from("salon_settings").insert(
      defaults.map((s) => ({
        salon_id: salonId,
        group_key: s.group,
        setting_key: s.key,
        value: asJson(s.value),
        level: "business" as const,
        scope_id: null,
        updated_by: actor,
        updated_at: now,
      })),
    );
  }

  const { count: flagCount } = await supabase
    .from("salon_feature_flags")
    .select("flag_key", { count: "exact", head: true })
    .eq("salon_id", salonId);

  if (!flagCount) {
    const flags = buildDefaultFeatureFlags();
    await supabase.from("salon_feature_flags").insert(
      flags.map((f) => ({
        salon_id: salonId,
        flag_key: f.key,
        enabled: f.enabled,
        config: asJson(f.config),
      })),
    );
  }
}

export async function resolveSalonSettings(
  supabase: AnySupabase,
  input: {
    salonId: string;
    group: SettingsGroupKey;
    serviceId?: string | null;
    staffId?: string | null;
    bookingId?: string | null;
    role?: SettingsRole;
  },
): Promise<ResolvedSettings> {
  const role = input.role ?? "owner";
  assertCanRead(role, input.group);
  await ensureDefaultSalonSettings(supabase, input.salonId);

  const defs = definitionsForGroup(input.group);

  const { data: platformRows } = await supabase
    .from("platform_settings")
    .select("setting_key, value")
    .eq("group_key", input.group);

  const { data: businessRows } = await supabase
    .from("salon_settings")
    .select("setting_key, value")
    .eq("salon_id", input.salonId)
    .eq("group_key", input.group)
    .eq("level", "business");

  let serviceRows: Array<{ setting_key: string; value: Json }> = [];
  let staffRows: Array<{ setting_key: string; value: Json }> = [];
  let bookingRows: Array<{ setting_key: string; value: Json }> = [];

  if (input.serviceId) {
    const { data } = await supabase
      .from("salon_settings")
      .select("setting_key, value")
      .eq("salon_id", input.salonId)
      .eq("group_key", input.group)
      .eq("level", "service")
      .eq("scope_id", input.serviceId);
    serviceRows = data ?? [];
  }
  if (input.staffId) {
    const { data } = await supabase
      .from("salon_settings")
      .select("setting_key, value")
      .eq("salon_id", input.salonId)
      .eq("group_key", input.group)
      .eq("level", "staff")
      .eq("scope_id", input.staffId);
    staffRows = data ?? [];
  }
  if (input.bookingId) {
    const { data } = await supabase
      .from("salon_settings")
      .select("setting_key, value")
      .eq("salon_id", input.salonId)
      .eq("group_key", input.group)
      .eq("level", "booking")
      .eq("scope_id", input.bookingId);
    bookingRows = data ?? [];
  }

  const resolved = resolveSettingsLayers({
    group: input.group,
    platform: (platformRows ?? []).map((r) => ({
      key: r.setting_key,
      value: fromJson(r.value),
    })),
    business: (businessRows ?? []).map((r) => ({
      key: r.setting_key,
      value: fromJson(r.value),
    })),
    service: serviceRows.map((r) => ({
      key: r.setting_key,
      value: fromJson(r.value),
    })),
    staff: staffRows.map((r) => ({
      key: r.setting_key,
      value: fromJson(r.value),
    })),
    booking: bookingRows.map((r) => ({
      key: r.setting_key,
      value: fromJson(r.value),
    })),
    definitions: defs.map((d) => ({
      key: d.key,
      defaultValue: d.defaultValue,
    })),
  });

  return {
    salonId: input.salonId,
    group: input.group,
    values: resolved.values,
    entries: resolved.entries,
    resolvedFrom: resolved.resolvedFrom,
  };
}

export async function upsertSalonSetting(
  supabase: AnySupabase,
  input: {
    salonId: string;
    group: SettingsGroupKey;
    key: string;
    value: unknown;
    level?: "business" | "service" | "staff" | "booking";
    scopeId?: string | null;
    role?: SettingsRole;
    actor?: string;
  },
): Promise<void> {
  const role = input.role ?? "owner";
  assertCanWrite(role, input.group);

  const level = input.level ?? "business";
  const scopeId = level === "business" ? null : input.scopeId ?? null;
  if (level !== "business" && !scopeId) {
    throw new Error("scopeId is required for non-business settings levels.");
  }

  const def = definitionsForGroup(input.group).find((d) => d.key === input.key);
  if (def?.delegatedToPolicyEngine) {
    throw new Error(
      `Setting ${input.group}.${input.key} is managed by the Booking & Payment Policy Engine.`,
    );
  }

  const now = new Date().toISOString();
  const row = {
    salon_id: input.salonId,
    group_key: input.group,
    setting_key: input.key,
    value: asJson(input.value),
    level,
    scope_id: scopeId,
    updated_by: input.actor ?? role,
    updated_at: now,
  };

  if (level === "business") {
    const { data: existing } = await supabase
      .from("salon_settings")
      .select("id")
      .eq("salon_id", input.salonId)
      .eq("group_key", input.group)
      .eq("setting_key", input.key)
      .eq("level", "business")
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("salon_settings")
        .update({
          value: row.value,
          updated_by: row.updated_by,
          updated_at: now,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return;
    }
  }

  const { error } = await supabase.from("salon_settings").upsert(row, {
    onConflict:
      level === "business"
        ? undefined
        : "salon_id,group_key,setting_key,level,scope_id",
  });
  // Partial unique indexes don't always work with onConflict — fallback insert/update
  if (error) {
    const { error: insertError } = await supabase.from("salon_settings").insert(row);
    if (insertError) {
      // try update by composite
      let q = supabase
        .from("salon_settings")
        .update({
          value: row.value,
          updated_by: row.updated_by,
          updated_at: now,
        })
        .eq("salon_id", input.salonId)
        .eq("group_key", input.group)
        .eq("setting_key", input.key)
        .eq("level", level);
      if (scopeId) q = q.eq("scope_id", scopeId);
      else q = q.is("scope_id", null);
      const { error: updateError } = await q;
      if (updateError) throw new Error(updateError.message);
    }
  }
}

export async function listFeatureFlags(
  supabase: AnySupabase,
  salonId: string,
): Promise<FeatureFlagState[]> {
  await ensureDefaultSalonSettings(supabase, salonId);
  const { data, error } = await supabase
    .from("salon_feature_flags")
    .select("flag_key, enabled, config")
    .eq("salon_id", salonId);
  if (error) throw new Error(error.message);

  const byKey = new Map(
    (data ?? []).map((r) => [
      r.flag_key,
      {
        key: r.flag_key as FeatureFlagKey,
        enabled: r.enabled,
        config:
          r.config && typeof r.config === "object" && !Array.isArray(r.config)
            ? (r.config as Record<string, unknown>)
            : {},
      },
    ]),
  );

  return FEATURE_FLAG_DEFINITIONS.map((def) => {
    const hit = byKey.get(def.key);
    return (
      hit ?? {
        key: def.key,
        enabled: def.defaultEnabled,
        config: {},
      }
    );
  });
}

export async function setFeatureFlag(
  supabase: AnySupabase,
  input: {
    salonId: string;
    key: FeatureFlagKey;
    enabled: boolean;
    config?: Record<string, unknown>;
  },
): Promise<FeatureFlagState> {
  if (!isFeatureFlagKey(input.key)) {
    throw new Error(`Unknown feature flag: ${input.key}`);
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("salon_feature_flags")
    .upsert(
      {
        salon_id: input.salonId,
        flag_key: input.key,
        enabled: input.enabled,
        config: asJson(input.config ?? {}),
        updated_at: now,
      },
      { onConflict: "salon_id,flag_key" },
    )
    .select("flag_key, enabled, config")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to set flag.");
  return {
    key: data.flag_key as FeatureFlagKey,
    enabled: data.enabled,
    config:
      data.config && typeof data.config === "object" && !Array.isArray(data.config)
        ? (data.config as Record<string, unknown>)
        : {},
  };
}

export async function listIntegrationSlots(
  supabase: AnySupabase,
  salonId: string,
): Promise<IntegrationSlot[]> {
  const providers: IntegrationProvider[] = [
    "stripe",
    "square",
    "tyro",
    "xero",
    "myob",
    "google_calendar",
    "outlook",
    "apple_calendar",
    "google_business",
    "meta",
    "instagram",
  ];
  const { data } = await supabase
    .from("salon_integration_slots")
    .select("provider, status, config, connected_at")
    .eq("salon_id", salonId);
  const byProvider = new Map((data ?? []).map((r) => [r.provider, r]));
  return providers.map((provider) => {
    const hit = byProvider.get(provider);
    return {
      provider,
      status: (hit?.status as IntegrationSlot["status"]) ?? "disconnected",
      config:
        hit?.config &&
        typeof hit.config === "object" &&
        !Array.isArray(hit.config)
          ? (hit.config as Record<string, unknown>)
          : {},
      connectedAt: hit?.connected_at ?? null,
    };
  });
}
