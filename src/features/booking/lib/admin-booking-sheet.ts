import { cn } from "@/lib/utils";

/**
 * Admin booking bottom sheet.
 * Mobile: full-width, height-capped, no transform (iOS native <select> breaks under translate).
 * Desktop: centered card with translate for alignment.
 */
export const adminBookingSheetClassName = cn(
  "gap-0 overflow-hidden border-stone-200/80 bg-white p-0",
  // Mobile — flush bottom, fixed height so inner scroll works and header stays visible
  "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:left-0 data-[side=bottom]:right-0",
  "data-[side=bottom]:w-full data-[side=bottom]:max-w-none data-[side=bottom]:translate-x-0",
  "data-[side=bottom]:h-[min(92dvh,100svh)] data-[side=bottom]:max-h-[min(92dvh,100svh)]",
  "data-[side=bottom]:rounded-t-[1.25rem] data-[side=bottom]:border-t",
  "data-[side=bottom]:pb-[env(safe-area-inset-bottom)]",
  // Desktop — centered floating card
  "md:data-[side=bottom]:inset-x-auto md:data-[side=bottom]:left-1/2 md:data-[side=bottom]:right-auto",
  "md:data-[side=bottom]:bottom-4 md:data-[side=bottom]:w-full md:data-[side=bottom]:max-w-md",
  "md:data-[side=bottom]:-translate-x-1/2 md:data-[side=bottom]:h-auto",
  "md:data-[side=bottom]:max-h-[min(92vh,820px)] md:rounded-2xl md:shadow-2xl",
);

export const adminBookingSheetBodyClassName =
  "mx-auto flex h-full max-h-full w-full max-w-md flex-col overflow-hidden";

export const adminBookingSheetHandleClassName =
  "mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-200 md:hidden";

export const adminBookingSheetScrollClassName =
  "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]";
