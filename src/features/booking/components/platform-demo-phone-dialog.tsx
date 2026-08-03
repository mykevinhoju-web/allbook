"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
        className={cn(
          "w-auto max-w-none border-0 bg-transparent p-0 shadow-none ring-0 outline-none sm:max-w-none",
          "data-open:zoom-in-95 data-closed:zoom-out-95",
        )}
      >
        <DialogTitle className="sr-only">AllBook booking demo</DialogTitle>

        <div className="relative flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute -top-1 right-0 z-40 flex size-9 items-center justify-center rounded-full bg-white text-neutral-700 shadow-lg transition hover:bg-neutral-50 sm:-right-12 sm:top-2"
            aria-label="Close demo"
          >
            <X className="size-4" strokeWidth={2.25} />
          </button>

          {/* Clean phone bezel — solid frame, no messy rings */}
          <div
            className={cn(
              "relative w-[min(375px,calc(100vw-2.75rem))]",
              "rounded-[2.75rem] bg-[#0B0B0C] p-[12px]",
              "shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            )}
          >
            {/* Subtle inner highlight (top edge only) */}
            <div className="pointer-events-none absolute inset-[12px] z-30 rounded-[2.15rem] ring-1 ring-inset ring-white/10" />

            {/* Screen */}
            <div className="relative isolate h-[min(720px,80svh)] overflow-hidden rounded-[2.15rem] bg-white">
              {/* Fixed notch + status strip — always above scroll content */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-11 bg-white">
                <div className="mx-auto mt-[10px] h-[28px] w-[108px] rounded-full bg-[#0B0B0C]" />
              </div>

              <div
                className={cn(
                  "h-full overflow-y-auto overscroll-contain pt-9",
                  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {open ? (
                  <PlatformDemoBooking key="phone-demo" variant="phone" />
                ) : null}
              </div>
            </div>
          </div>

          <p className="text-center text-xs font-medium tracking-wide text-white/70">
            Interactive demo · nothing is saved
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
