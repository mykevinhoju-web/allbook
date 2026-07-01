import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98]",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80 active:scale-[0.98]",
        danger:
          "bg-destructive text-white shadow-soft hover:bg-destructive/90 active:scale-[0.98]",
        success:
          "bg-success text-success-foreground shadow-soft hover:bg-success/90 active:scale-[0.98]",
        ghost:
          "text-foreground hover:bg-muted",
        outline:
          "border-border bg-background text-foreground shadow-soft hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type AppButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof appButtonVariants>;

function AppButton({
  className,
  variant = "primary",
  size = "default",
  ...props
}: AppButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="app-button"
      className={cn(appButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { AppButton, appButtonVariants };
