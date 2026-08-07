import type { Json } from "@/types/database";

import {
  FEATURE_FLAG_DEFINITIONS,
  SETTING_DEFINITIONS,
} from "./registry";
import type {
  FeatureFlagKey,
  FeatureFlagState,
  SettingEntry,
  SettingsGroupKey,
  SettingsLevel,
} from "./types";

export function defaultValueForSetting(
  group: SettingsGroupKey,
  key: string,
): unknown {
  const def = SETTING_DEFINITIONS.find(
    (d) => d.group === group && d.key === key,
  );
  return def ? def.defaultValue : null;
}

export function buildDefaultBusinessSettings(): Array<{
  group: SettingsGroupKey;
  key: string;
  value: unknown;
}> {
  return SETTING_DEFINITIONS.filter((d) => !d.delegatedToPolicyEngine).map(
    (d) => ({
      group: d.group,
      key: d.key,
      value: d.defaultValue,
    }),
  );
}

export function buildDefaultFeatureFlags(): FeatureFlagState[] {
  return FEATURE_FLAG_DEFINITIONS.map((f) => ({
    key: f.key,
    enabled: f.defaultEnabled,
    config: {},
  }));
}

export function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

export function fromJson(value: Json): unknown {
  return value as unknown;
}

type LayerMap = Map<string, { value: unknown; level: SettingsLevel | "default" }>;

function layerKey(group: string, key: string) {
  return `${group}::${key}`;
}

/**
 * Resolve settings: Platform → Business → Service → Staff → Booking.
 * Later layers win. Missing keys fall back to registry defaults.
 */
export function resolveSettingsLayers(input: {
  group: SettingsGroupKey;
  platform: Array<{ key: string; value: unknown }>;
  business: Array<{ key: string; value: unknown }>;
  service?: Array<{ key: string; value: unknown }>;
  staff?: Array<{ key: string; value: unknown }>;
  booking?: Array<{ key: string; value: unknown }>;
  definitions?: Array<{ key: string; defaultValue: unknown }>;
}): {
  values: Record<string, unknown>;
  entries: SettingEntry[];
  resolvedFrom: Record<string, SettingsLevel | "default">;
} {
  const map: LayerMap = new Map();

  const apply = (
    rows: Array<{ key: string; value: unknown }> | undefined,
    level: SettingsLevel | "default",
    scopeId: string | null = null,
  ) => {
    if (!rows) return;
    for (const row of rows) {
      map.set(layerKey(input.group, row.key), {
        value: row.value,
        level,
      });
      void scopeId;
    }
  };

  const defs =
    input.definitions ??
    SETTING_DEFINITIONS.filter((d) => d.group === input.group).map((d) => ({
      key: d.key,
      defaultValue: d.defaultValue,
    }));

  for (const d of defs) {
    map.set(layerKey(input.group, d.key), {
      value: d.defaultValue,
      level: "default",
    });
  }

  apply(input.platform, "platform");
  apply(input.business, "business");
  apply(input.service, "service");
  apply(input.staff, "staff");
  apply(input.booking, "booking");

  const values: Record<string, unknown> = {};
  const resolvedFrom: Record<string, SettingsLevel | "default"> = {};
  const entries: SettingEntry[] = [];

  for (const d of defs) {
    const hit = map.get(layerKey(input.group, d.key));
    const value = hit?.value ?? d.defaultValue;
    const level = hit?.level ?? "default";
    values[d.key] = value;
    resolvedFrom[d.key] = level;
    entries.push({
      group: input.group,
      key: d.key,
      value,
      level: level === "default" ? "business" : level,
      scopeId: null,
      source: level === "default" ? "default" : level,
    });
  }

  return { values, entries, resolvedFrom };
}

export function isFeatureFlagKey(value: string): value is FeatureFlagKey {
  return FEATURE_FLAG_DEFINITIONS.some((f) => f.key === value);
}
