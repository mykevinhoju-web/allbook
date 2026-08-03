import { cn } from "@/lib/utils";

type AllBookLogoProps = {
  className?: string;
  /** Mark + wordmark height roughly */
  size?: "sm" | "md" | "lg" | "xl";
  /** Color treatment */
  variant?: "blue" | "white" | "ink";
  /** Hide wordmark (mark only) */
  markOnly?: boolean;
  /** Stack mark above wordmark (vertical lockup) */
  layout?: "horizontal" | "vertical";
};

const SIZE = {
  sm: { mark: 22, text: "text-sm", gap: "gap-1.5", tracking: "tracking-[0.14em]" },
  md: { mark: 28, text: "text-base", gap: "gap-2", tracking: "tracking-[0.14em]" },
  lg: { mark: 36, text: "text-xl", gap: "gap-2.5", tracking: "tracking-[0.16em]" },
  xl: { mark: 56, text: "text-2xl", gap: "gap-3", tracking: "tracking-[0.18em]" },
} as const;

const TEXT_COLOR = {
  blue: "text-[#2563FF]",
  white: "text-white",
  ink: "text-stone-900",
} as const;

/** Crisp vector mark — avoids pixelated PNGs at small sizes. */
export function AllBookMark({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Legs + apex */}
        <path strokeWidth="11" d="M18 86 50 12 82 86" />
        {/* Bottom feet with shallow upward V */}
        <path strokeWidth="11" d="M18 86Q35 98 50 74 65 98 82 86" />
        {/* Inner chevron */}
        <path strokeWidth="9" d="M37 38 50 54 63 38" />
      </g>
    </svg>
  );
}

/**
 * Official AllBook logo lockup (vector mark + wordmark).
 */
export function AllBookLogo({
  className,
  size = "sm",
  variant = "blue",
  markOnly = false,
  layout = "horizontal",
}: AllBookLogoProps) {
  const s = SIZE[size];
  const vertical = layout === "vertical";

  return (
    <span
      className={cn(
        "inline-flex",
        vertical ? "flex-col items-center" : "items-center",
        s.gap,
        TEXT_COLOR[variant],
        className,
      )}
    >
      <AllBookMark size={s.mark} />
      {!markOnly ? (
        <span
          className={cn(
            "font-bold uppercase leading-none",
            s.text,
            s.tracking,
          )}
        >
          ALLBOOK
        </span>
      ) : null}
    </span>
  );
}
