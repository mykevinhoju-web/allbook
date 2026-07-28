export const PORTAL_THEME_CLASS = "portal-theme";

/** Default PWA / browser chrome color (matches soft gray background). */
export const PORTAL_THEME_COLOR = "#d6d2cb";

/** Editable keys stored on tenant.settings.portalTheme (hex). Used by room tablet. */
export const PORTAL_THEME_FIELDS = [
  { key: "background", label: "Background", cssVar: "--background" },
  { key: "card", label: "Cards / panels", cssVar: "--card" },
  { key: "sidebar", label: "Secondary panel", cssVar: "--sidebar" },
  { key: "muted", label: "Muted areas", cssVar: "--muted" },
  { key: "border", label: "Borders", cssVar: "--border" },
  { key: "primary", label: "Primary accent", cssVar: "--primary" },
  { key: "foreground", label: "Main text", cssVar: "--foreground" },
  {
    key: "mutedForeground",
    label: "Secondary text",
    cssVar: "--muted-foreground",
  },
] as const;

export type PortalThemeFieldKey = (typeof PORTAL_THEME_FIELDS)[number]["key"];

export type PortalThemeColors = Partial<Record<PortalThemeFieldKey, string>>;

/** Defaults shown in the Appearance editor (approx of CSS oklch defaults). */
export const DEFAULT_PORTAL_THEME: Record<PortalThemeFieldKey, string> = {
  background: "#d6d2cb",
  card: "#e8e4dd",
  sidebar: "#ccc7be",
  muted: "#c9c3b9",
  border: "#b5aea3",
  primary: "#3d6db5",
  foreground: "#3f3a32",
  mutedForeground: "#7a7368",
};

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

export function parsePortalTheme(raw: unknown): PortalThemeColors | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const input = raw as Record<string, unknown>;
  const parsed: PortalThemeColors = {};

  for (const field of PORTAL_THEME_FIELDS) {
    const value = input[field.key];
    if (isHexColor(value)) {
      parsed[field.key] = value.toLowerCase();
    }
  }

  return Object.keys(parsed).length > 0 ? parsed : undefined;
}

export function mergePortalTheme(
  saved?: PortalThemeColors | null,
): Record<PortalThemeFieldKey, string> {
  return { ...DEFAULT_PORTAL_THEME, ...saved };
}

/** Relative luminance 0–1 for #RRGGBB (sRGB). */
export function hexLuminance(hex: string): number {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return 0.5;
  const channel = (start: number) => {
    const value = Number.parseInt(raw.slice(start, start + 2), 16) / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

/**
 * Secondary label color for room UI (THIS TABLET, Staff PIN, …).
 * Picks a readable default when the saved theme has no mutedForeground yet.
 */
export function resolveMutedForeground(
  colors?: PortalThemeColors | null,
): string {
  if (colors?.mutedForeground && isHexColor(colors.mutedForeground)) {
    return colors.mutedForeground;
  }

  const background = colors?.background ?? DEFAULT_PORTAL_THEME.background;
  if (hexLuminance(background) < 0.45) {
    return "#c8c2b8";
  }

  return DEFAULT_PORTAL_THEME.mutedForeground;
}
