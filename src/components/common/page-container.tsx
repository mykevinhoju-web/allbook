import { cn } from "@/lib/utils";

interface PageContainerProps extends React.ComponentProps<"div"> {
  size?: "default" | "narrow" | "wide";
}

const sizeClasses = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

export function PageContainer({
  className,
  size = "default",
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 md:py-8",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
