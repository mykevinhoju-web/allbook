import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface PlatformStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function PlatformStatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: PlatformStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-card p-5 shadow-soft",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
