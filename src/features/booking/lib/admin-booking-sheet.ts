import { cn } from "@/lib/utils";

/**
 * Admin booking sheet, anchored to the top of the screen.
 * Mobile: full-width, height-capped, no transform (iOS native <select> breaks under translate).
 * Desktop: centered card with translate for alignment.
 */
export const adminBookingSheetClassName = cn(
  "gap-0 overflow-hidden border-stone-200/80 bg-white p-0",
  // Mobile — flush top, fixed height so inner scroll works and header stays visible
  "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:left-0 data-[side=top]:right-0",
  "data-[side=top]:w-full data-[side=top]:max-w-none data-[side=top]:translate-x-0",
  "data-[side=top]:h-[min(92dvh,100svh)] data-[side=top]:max-h-[min(92dvh,100svh)]",
  "data-[side=top]:rounded-b-[1.25rem] data-[side=top]:border-b",
  "data-[side=top]:pt-[env(safe-area-inset-top)]",
  // Desktop — centered floating card near the top
  "md:data-[side=top]:inset-x-auto md:data-[side=top]:left-1/2 md:data-[side=top]:right-auto",
  "md:data-[side=top]:top-4 md:data-[side=top]:w-full md:data-[side=top]:max-w-md",
  "md:data-[side=top]:-translate-x-1/2 md:data-[side=top]:h-auto",
  "md:data-[side=top]:max-h-[min(92vh,820px)] md:rounded-2xl md:shadow-2xl",
);

export const adminBookingSheetBodyClassName =
  "mx-auto flex h-full max-h-full w-full max-w-md flex-col overflow-hidden";

export const adminBookingSheetHandleClassName =
  "mx-auto mb-1 mt-2 h-1 w-10 shrink-0 rounded-full bg-stone-200 md:hidden";

export const adminBookingSheetScrollClassName =
  "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]";
