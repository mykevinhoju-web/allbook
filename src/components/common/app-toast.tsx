"use client";

import { Toaster as Sonner, toast } from "sonner";

type AppToasterProps = React.ComponentProps<typeof Sonner>;

export function AppToaster({ ...props }: AppToasterProps) {
  return (
    <Sonner
      theme="system"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-border/60 bg-card text-card-foreground shadow-soft-lg",
          title: "text-sm font-medium",
          description: "text-sm text-muted-foreground",
          actionButton: "rounded-lg bg-primary text-primary-foreground",
          cancelButton: "rounded-lg bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { toast };
