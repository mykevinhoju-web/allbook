"use client";

import { useEffect, useMemo } from "react";

import { useOptionalTenant } from "@/features/tenants";

import {
  PORTAL_THEME_CLASS,
  PORTAL_THEME_FIELDS,
  type PortalThemeColors,
} from "./portal-theme";

const OVERRIDE_VARS = PORTAL_THEME_FIELDS.map((field) => field.cssVar);

function applyColorOverrides(colors?: PortalThemeColors | null) {
  const root = document.documentElement;
  for (const field of PORTAL_THEME_FIELDS) {
    const value = colors?.[field.key];
    if (value) {
      root.style.setProperty(field.cssVar, value);
    } else {
      root.style.removeProperty(field.cssVar);
    }
  }
}

/** Attaches shared portal theme to <html> for admin / staff / room chrome. */
export function PortalThemeRoot({
  colors,
}: {
  colors?: PortalThemeColors | null;
} = {}) {
  const tenant = useOptionalTenant();
  const fromTenant = tenant?.settings.portalTheme ?? null;
  const themeKey = useMemo(
    () => JSON.stringify(colors ?? fromTenant ?? null),
    [colors, fromTenant],
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(PORTAL_THEME_CLASS);
    const parsed = themeKey === "null" ? null : (JSON.parse(themeKey) as PortalThemeColors);
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
