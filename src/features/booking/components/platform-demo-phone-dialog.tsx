"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import { PlatformDemoBooking } from "./platform-demo-booking";

export function PlatformDemoPhoneDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-auto max-w-none border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">AllBook booking demo</DialogTitle>

        <div className="relative flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute -top-2 -right-2 z-30 flex size-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md ring-1 ring-black/10 transition hover:bg-neutral-50 sm:-right-10 sm:top-0"
            aria-label="Close demo"
          >
            <X className="size-4" />
          </button>

          {/* Phone chrome */}
          <div className="relative w-[min(390px,calc(100vw-2.5rem))] overflow-hidden rounded-[2.35rem] bg-neutral-950 p-[11px] shadow-[0_28px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
            <div className="pointer-events-none absolute top-3 left-1/2 z-20 h-6 w-[7.25rem] -translate-x-1/2 rounded-full bg-black" />
            <div className="relative h-[min(740px,82svh)] overflow-hidden rounded-[1.85rem] bg-white">
              <div className="h-full overflow-y-auto overscroll-contain">
                {open ? <PlatformDemoBooking key="phone-demo" variant="phone" /> : null}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/80">
            Interactive demo · no real booking is saved
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
