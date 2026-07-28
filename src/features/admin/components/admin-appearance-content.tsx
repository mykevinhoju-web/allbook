"use client";

import { useState } from "react";

import { AppButton, toast } from "@/components/common";
import {
  DEFAULT_PORTAL_THEME,
  PORTAL_THEME_FIELDS,
  mergePortalTheme,
  type PortalThemeColors,
  type PortalThemeFieldKey,
} from "@/features/portal-theme";
import { useTenant } from "@/features/tenants";

import { AdminPageHeader } from "./admin-page-header";

export function AdminAppearanceContent() {
  const tenant = useTenant();
  const [colors, setColors] = useState<Record<PortalThemeFieldKey, string>>(() =>
    mergePortalTheme(tenant.settings.portalTheme),
  );
  const [saving, setSaving] = useState(false);

  const setField = (key: PortalThemeFieldKey, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalTheme: colors }),
      });
      const data = (await response.json()) as {
        error?: string;
        portalTheme?: PortalThemeColors;
      };
      if (!response.ok) {
        toast.error("Could not save theme", { description: data.error });
        return;
      }
      if (data.portalTheme) {
        setColors(mergePortalTheme(data.portalTheme));
      }
      toast.success("Theme saved", {
        description: "Room tablet screens will use these colors.",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setColors({ ...DEFAULT_PORTAL_THEME });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Appearance"
        description="Colors for the room tablet only. Secondary text controls labels like “This tablet”, “Staff PIN”, and “Change room”. Admin, staff, and customer booking stay unchanged."
      />

      <div className="grid gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft md:max-w-2xl md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {PORTAL_THEME_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center gap-3 text-sm">
              <input
                type="color"
                value={colors[field.key]}
                onChange={(event) => setField(field.key, event.target.value)}
                className="size-10 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground">
                  {field.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {colors[field.key]}
                </span>
              </span>
            </label>
          ))}
        </div>

        <div
          className="overflow-hidden rounded-xl border border-border"
          style={{
            background: colors.background,
            color: colors.foreground,
          }}
        >
          <div className="flex items-stretch" style={{ minHeight: 120 }}>
            <div
              className="w-24 shrink-0 p-3 text-xs"
              style={{ background: colors.sidebar }}
            >
              Panel
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div
                className="rounded-lg border p-3 text-sm"
                style={{
                  background: colors.card,
                  borderColor: colors.border,
                }}
              >
                Room card preview
              </div>
              <div
                className="inline-flex w-fit rounded-lg px-3 py-1.5 text-xs text-white"
                style={{ background: colors.primary }}
              >
                Primary
              </div>
              <div
                className="rounded-md px-2 py-1 text-xs"
                style={{ background: colors.muted }}
              >
                Muted
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AppButton
            type="button"
            className="rounded-xl"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Saving…" : "Save theme"}
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={saving}
            onClick={resetDefaults}
          >
            Reset defaults
          </AppButton>
        </div>
      </div>
    </div>
  );
}
