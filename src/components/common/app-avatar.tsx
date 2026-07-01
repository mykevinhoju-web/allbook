import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "default" | "lg" | "xl";

interface AppAvatarProps
  extends Omit<React.ComponentProps<typeof Avatar>, "size"> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
};

export function AppAvatar({
  src,
  alt = "Avatar",
  fallback,
  size = "default",
  className,
  ...props
}: AppAvatarProps) {
  const initials =
    fallback ??
    alt
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)} {...props}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export { Avatar, AvatarFallback, AvatarImage };
