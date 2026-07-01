/**
 * AllBook design system tokens.
 * CSS variables are defined in src/app/globals.css.
 */
export const designTokens = {
  colors: {
    primary: "Blue — wellness & trust",
    background: "White (light) / deep blue-gray (dark)",
    success: "Emerald green",
    destructive: "Soft red",
  },
  radius: {
    card: "12px (0.75rem)",
    button: "12px (rounded-xl)",
  },
  shadow: {
    soft: "shadow-soft",
    softLg: "shadow-soft-lg",
  },
  buttonVariants: ["primary", "secondary", "danger", "success", "ghost", "outline"] as const,
  statusBadgeVariants: [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "active",
    "inactive",
    "suspended",
  ] as const,
} as const;
