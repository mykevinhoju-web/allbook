import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { EVER_BRAND } from "../theme";

type EverLogoProps = {
  href?: string | null;
  className?: string;
  /** Display width in px — height scales with logo aspect ratio. */
  width?: number;
  priority?: boolean;
};

/** Brand mark — transparent PNG, sits on any dark Ever surface. */
export function EverLogo({
  href = "/",
  className,
  width = 220,
  priority = false,
}: EverLogoProps) {
  const height = Math.round(width * 1.15);

  const image = (
    <Image
      src={EVER_BRAND.logoPath}
      alt="Everwell Massage & Wellness"
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-auto max-w-full", className)}
    />
  );

  if (!href) {
    return image;
  }

  return (
    <Link href={href} className="inline-block shrink-0">
      {image}
    </Link>
  );
}
