import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { EVER_BRAND } from "../theme";

type EverLogoProps = {
  href?: string;
  className?: string;
  /** Display width in px — height scales with logo aspect ratio. */
  width?: number;
  priority?: boolean;
};

export function EverLogo({
  href = "/",
  className,
  width = 220,
  priority = false,
}: EverLogoProps) {
  const height = Math.round(width * 1.15);

  const image = (
    <span
      className={cn(
        "inline-block rounded-lg bg-[#F5F3EE] px-5 py-4 shadow-lg shadow-black/15",
        className,
      )}
    >
      <Image
        src={EVER_BRAND.logoPath}
        alt="Everwell Massage & Wellness"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto max-w-full"
      />
    </span>
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
