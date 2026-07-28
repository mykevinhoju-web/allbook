"use client";

import { useEffect, useMemo, useState } from "react";

import { useOptionalTenant } from "@/features/tenants";

import {
  PORTAL_THEME_CLASS,
  PORTAL_THEME_FIELDS,
  resolveMutedForeground,
  type PortalThemeColors,
} from "./portal-theme";

const OVERRIDE_VARS = [
  ...PORTAL_THEME_FIELDS.map((field) => field.cssVar),
  "--ring",
  "--sidebar-primary",
  "--card-foreground",
  "--popover-foreground",
  "--sidebar-foreground",
];

function applyColorOverrides(colors?: PortalThemeColors | null) {
  const root = document.documentElement;
  for (const field of PORTAL_THEME_FIELDS) {
    if (field.key === "mutedForeground") continue;
    const value = colors?.[field.key];
    if (value) {
      root.style.setProperty(field.cssVar, value);
    } else {
      root.style.removeProperty(field.cssVar);
    }
  }

  const mutedForeground = resolveMutedForeground(colors);
  root.style.setProperty("--muted-foreground", mutedForeground);

  const foreground = colors?.foreground;
  if (foreground) {
    root.style.setProperty("--card-foreground", foreground);
    root.style.setProperty("--popover-foreground", foreground);
    root.style.setProperty("--sidebar-foreground", foreground);
  } else {
    root.style.removeProperty("--card-foreground");
    root.style.removeProperty("--popover-foreground");
    root.style.removeProperty("--sidebar-foreground");
  }

  const primary = colors?.primary;
  if (primary) {
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--sidebar-primary", primary);
  } else {
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
  }
}

/**
 * Applies Appearance colors to the room tablet chrome only.
 * Prefer `fetchFrom` so colors stay fresh after admin saves (tenant SSR cache).
 */
export function PortalThemeRoot({
  colors,
  fetchFrom = null,
}: {
  colors?: PortalThemeColors | null;
  /** e.g. `/api/room/theme` — loads latest colors from DB */
  fetchFrom?: string | null;
} = {}) {
  const tenant = useOptionalTenant();
  const fromTenant = tenant?.settings.portalTheme ?? null;
  const [fetched, setFetched] = useState<PortalThemeColors | null>(null);

  useEffect(() => {
    if (!fetchFrom) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(fetchFrom, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          portalTheme?: PortalThemeColors;
        };
        if (!cancelled && data.portalTheme) {
          setFetched(data.portalTheme);
        }
      } catch {
        // Keep fallback from props / tenant.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchFrom]);

  const themeKey = useMemo(
    () => JSON.stringify(fetched ?? colors ?? fromTenant ?? null),
    [fetched, colors, fromTenant],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(PORTAL_THEME_CLASS);
    const parsed =
      themeKey === "null"
        ? null
        : (JSON.parse(themeKey) as PortalThemeColors);
    applyColorOverrides(parsed);

    return () => {
      root.classList.remove(PORTAL_THEME_CLASS);
      for (const cssVar of OVERRIDE_VARS) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [themeKey]);

  return null;
}
