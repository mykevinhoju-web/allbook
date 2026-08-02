import Image from "next/image";

import { cn } from "@/lib/utils";

type AllBookLogoProps = {
  className?: string;
  /** Mark + wordmark height roughly */
  size?: "sm" | "md" | "lg";
  /** Color treatment */
  variant?: "blue" | "white" | "ink";
  /** Hide wordmark (mark only) */
  markOnly?: boolean;
};

const SIZE = {
  sm: { mark: 22, text: "text-sm", gap: "gap-1.5" },
  md: { mark: 28, text: "text-base", gap: "gap-2" },
  lg: { mark: 36, text: "text-xl", gap: "gap-2.5" },
} as const;

const TEXT_COLOR = {
  blue: "text-[#2563FF]",
  white: "text-white",
  ink: "text-stone-900",
} as const;

/**
 * Official AllBook logo lockup (mark from brand sheet + wordmark).
 */
export function AllBookLogo({
  className,
  size = "sm",
  variant = "blue",
  markOnly = false,
}: AllBookLogoProps) {
  const s = SIZE[size];
  const markSrc =
    variant === "white"
      ? "/brand/allbook-mark-white.png"
      : "/brand/allbook-mark.png";

  return (
    <span
      className={cn(
        "inline-flex items-center",
        s.gap,
        !markOnly && TEXT_COLOR[variant],
        className,
      )}
    >
      <Image
        src={markSrc}
        alt={markOnly ? "AllBook" : ""}
        width={s.mark}
        height={s.mark}
        className="shrink-0 object-contain"
        priority
      />
      {!markOnly ? (
        <span
          className={cn(
            "font-bold uppercase leading-none tracking-[0.14em]",
            s.text,
          )}
        >
          ALLBOOK
        </span>
      ) : null}
    </span>
  );
}
