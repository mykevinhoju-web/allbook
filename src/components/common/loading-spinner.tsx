import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "default" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
} as const;

export function LoadingSpinner({
  size = "default",
  label = "Loading",
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size])}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface LoadingOverlayProps extends LoadingSpinnerProps {
  fullScreen?: boolean;
}

export function LoadingOverlay({
  fullScreen = false,
  label = "Loading",
  className,
  size = "lg",
  ...props
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-background/70 backdrop-blur-[1px]",
        fullScreen ? "fixed inset-0 z-50" : "absolute inset-0 z-10 rounded-xl",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={size} label={label} />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
