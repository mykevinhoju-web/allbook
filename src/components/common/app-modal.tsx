"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AppModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function AppModal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
  showCloseButton = true,
}: AppModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger render={trigger as React.ReactElement} /> : null}
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "rounded-xl border-border/60 shadow-soft-lg sm:max-w-md",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export {
  Dialog as AppModalRoot,
  DialogTrigger as AppModalTrigger,
  DialogContent as AppModalContent,
  DialogHeader as AppModalHeader,
  DialogTitle as AppModalTitle,
  DialogDescription as AppModalDescription,
  DialogFooter as AppModalFooter,
};
