/** Shared premium styling for customer-facing booking pages. */
export const bookingCustomerTheme = {
  page: "min-h-svh bg-white text-stone-900",
  shell: "mx-auto min-h-svh max-w-md border-stone-100 md:border-x",
  header:
    "sticky top-0 z-10 border-b border-stone-100 bg-white/95 px-4 py-4 backdrop-blur-md",
  headerCompact:
    "sticky top-0 z-10 flex items-center gap-2 border-b border-stone-100 bg-white/95 px-4 py-3 backdrop-blur-md",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-widest text-[#A68B2A]",
  title: "mt-0.5 text-lg font-semibold tracking-tight text-stone-900",
  staffCard:
    "flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white px-3 py-3.5 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  panel:
    "rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  role: "text-xs text-stone-500",
  photo:
    "relative size-28 shrink-0 overflow-hidden rounded-full bg-stone-100 shadow-md ring-2 ring-stone-100",
  photoFallback:
    "flex size-full items-center justify-center bg-stone-100 text-sm font-semibold text-[#A68B2A]",
  photoHero:
    "relative mx-auto size-28 overflow-hidden rounded-full bg-stone-100 shadow-md ring-4 ring-white",
  goldButton:
    "inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-b from-[#D4B84A] to-[#B8941F] px-5 text-sm font-semibold text-white shadow-[0_2px_10px_-2px_rgba(184,148,31,0.45)] transition-all active:scale-[0.98] active:brightness-95 disabled:pointer-events-none disabled:opacity-40",
  mutedButton:
    "inline-flex h-11 w-full items-center justify-center rounded-full bg-stone-100 px-5 text-sm font-semibold text-stone-400",
  label:
    "block text-xs font-semibold uppercase tracking-wider text-stone-500",
  field:
    "mt-1 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-[#C5A028] focus:ring-1 focus:ring-[#C5A028]/25",
  backButton:
    "flex size-9 items-center justify-center rounded-full text-[#B8941F] hover:bg-stone-50",
  shiftBanner:
    "rounded-xl bg-stone-50 px-3 py-2 text-center text-sm text-stone-700",
  priceBox: "rounded-xl bg-stone-50 px-4 py-3 text-center",
  priceLabel:
    "text-xs font-semibold uppercase tracking-wider text-[#A68B2A]",
  successIcon: "mx-auto size-14 text-[#B8941F]",
  skeletonCard:
    "flex animate-pulse items-center gap-4 rounded-2xl border border-stone-100 bg-white px-3 py-3.5",
  emptyState:
    "rounded-2xl border border-stone-100 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500",
  errorState:
    "rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm text-red-700",
  goldAccent: "text-[#B8941F]",
  goldChipSelected: "bg-[#B8941F] text-white",
  goldChipIdle: "bg-stone-100 hover:bg-stone-200/80",
  goldNextSlot:
    "border-[#C5A028]/30 bg-[#C5A028]/5",
} as const;
