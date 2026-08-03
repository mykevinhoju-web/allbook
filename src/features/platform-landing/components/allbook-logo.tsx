import Image from "next/image";

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
  sm: { mark: 22, text: "text-sm", gap: "gap-1.5", tracking: "tracking-[0.14em]", vertical: 56 },
  md: { mark: 28, text: "text-base", gap: "gap-2", tracking: "tracking-[0.14em]", vertical: 72 },
  lg: { mark: 36, text: "text-xl", gap: "gap-2.5", tracking: "tracking-[0.16em]", vertical: 96 },
  xl: { mark: 56, text: "text-2xl", gap: "gap-3", tracking: "tracking-[0.18em]", vertical: 128 },
} as const;

const TEXT_COLOR = {
  blue: "text-[#2563FF]",
  white: "text-white",
  ink: "text-stone-900",
} as const;

/** Official AllBook mark from brand sheet. */
export function AllBookMark({
  className,
  size = 22,
  variant = "blue",
}: {
  className?: string;
  size?: number;
  variant?: "blue" | "white" | "ink";
}) {
  const src =
    variant === "white"
      ? "/brand/allbook-mark-white.png"
      : "/brand/allbook-mark.png";

  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}

/**
 * Official AllBook logo lockup (brand mark + wordmark).
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

  if (vertical && !markOnly && variant === "blue") {
    return (
      <Image
        src="/brand/allbook-logo-vertical.png"
        alt="AllBook"
        width={s.vertical}
        height={Math.round(s.vertical * 0.92)}
        className={cn("object-contain", className)}
        priority
      />
    );
  }

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
      <AllBookMark size={s.mark} variant={variant === "ink" ? "blue" : variant} />
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
