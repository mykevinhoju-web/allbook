export const PORTAL_THEME_CLASS = "portal-theme";

/** Default PWA / browser chrome color (matches soft gray background). */
export const PORTAL_THEME_COLOR = "#d6d2cb";

/** Editable keys stored on tenant.settings.portalTheme (hex). */
export const PORTAL_THEME_FIELDS = [
  { key: "background", label: "Background", cssVar: "--background" },
  { key: "card", label: "Cards / panels", cssVar: "--card" },
  { key: "sidebar", label: "Sidebar", cssVar: "--sidebar" },
  { key: "muted", label: "Muted areas", cssVar: "--muted" },
  { key: "border", label: "Borders", cssVar: "--border" },
  { key: "primary", label: "Primary accent", cssVar: "--primary" },
  { key: "foreground", label: "Text", cssVar: "--foreground" },
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
