/** Shared premium styling for customer-facing booking pages. */
export const bookingCustomerTheme = {
  page: "min-h-svh bg-white text-stone-900",
  shell: "mx-auto min-h-svh max-w-md border-stone-100 md:border-x",
  header:
    "sticky top-0 z-10 border-b border-stone-100 bg-white/95 px-4 py-4 backdrop-blur-md",
  headerCompact:
    "sticky top-0 z-10 flex items-center gap-2 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur-md",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-widest text-[#8A6A3A]",
  title: "mt-0.5 text-lg font-semibold tracking-tight text-stone-900",
  staffCard:
    "flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white px-3 py-3.5 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  panel:
    "rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  role: "text-xs text-stone-500",
  photo:
    "relative size-28 shrink-0 overflow-hidden rounded-full bg-stone-100 shadow-md ring-2 ring-stone-100",
  photoFallback:
    "flex size-full items-center justify-center bg-stone-100 text-sm font-semibold text-[#8A6A3A]",
  photoHero:
    "relative mx-auto size-28 overflow-hidden rounded-full bg-stone-100 shadow-md ring-4 ring-white",
  goldButton:
    "inline-flex h-11 w-full items-center justify-center rounded-[15px] border border-white/15 bg-gradient-to-b from-[#9A7A46] via-[#8A6A3A] to-[#72552D] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-10px_18px_rgba(0,0,0,0.18)] tracking-[0.3px] transition-all active:scale-[0.98] hover:from-[#B18E54] hover:via-[#A98750] hover:to-[#7B5C33] disabled:pointer-events-none disabled:opacity-40",
  mutedButton:
    "inline-flex h-11 w-full items-center justify-center rounded-[15px] bg-stone-100 px-5 text-sm font-semibold text-stone-400",
  label:
    "block text-xs font-semibold uppercase tracking-wider text-stone-500",
  field:
    "mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-[#8A6A3A] focus:ring-1 focus:ring-[#8A6A3A]/25",
  backButton:
    "flex size-9 items-center justify-center rounded-full text-[#8A6A3A] hover:bg-stone-50",
  shiftBanner:
    "rounded-xl bg-stone-50 px-3 py-2 text-center text-sm text-stone-700",
  priceBox: "rounded-xl bg-stone-50 px-4 py-3 text-center",
  priceLabel:
    "text-xs font-semibold uppercase tracking-wider text-[#8A6A3A]",
  successIcon: "mx-auto size-14 text-[#8A6A3A]",
  skeletonCard:
    "flex animate-pulse items-center gap-4 rounded-2xl border border-stone-100 bg-white px-3 py-3.5",
  emptyState:
    "rounded-2xl border border-stone-100 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500",
  errorState:
    "rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-700",
  goldAccent: "text-[#8A6A3A]",
  goldChipSelected: "bg-[#8A6A3A] text-white",
  goldChipIdle: "bg-stone-100 hover:bg-stone-200/80",
  goldNextSlot:
    "border-[#8A6A3A]/25 bg-[#8A6A3A]/5",
} as const;
