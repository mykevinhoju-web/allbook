import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      status: {
        pending:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
        confirmed:
          "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
        completed:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
        cancelled:
          "border-border bg-muted text-muted-foreground",
        active:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
        inactive:
          "border-border bg-muted text-muted-foreground",
        suspended:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  active: "Active",
  inactive: "Inactive",
  suspended: "Suspended",
} as const;

type StatusBadgeStatus = keyof typeof statusLabels;

interface StatusBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof statusBadgeVariants> {
  status: StatusBadgeStatus;
  label?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  label,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ status }), className)}
      {...props}
    >
      {showDot ? (
        <span
          className="size-1.5 rounded-full bg-current opacity-80"
          aria-hidden="true"
        />
      ) : null}
      {label ?? statusLabels[status]}
    </span>
  );
}

export type { StatusBadgeStatus };
