/** Shared premium styling for customer-facing booking pages. */
export const bookingCustomerTheme = {
  page: "min-h-svh bg-white text-stone-900",
  shell: "mx-auto min-h-svh max-w-md border-stone-100 md:border-x",
  header:
    "sticky top-0 z-20 border-b border-stone-100 bg-white px-4 py-5",
  headerCompact:
    "sticky top-0 z-20 flex items-center gap-2 border-b border-stone-100 bg-white px-4 py-3.5",
  eyebrow:
    "text-[11px] font-semibold uppercase tracking-widest text-[#8A6A3A]",
  /** Main page titles — strongest hierarchy signal */
  title:
    "mt-1.5 text-2xl font-bold leading-tight tracking-tight text-stone-900",
  /** Compact sticky header title (therapist name on checkout) */
  titleCompact:
    "truncate text-base font-bold leading-snug tracking-tight text-stone-900",
  /** In-flow section / person headings */
  sectionTitle:
    "text-xl font-bold leading-snug tracking-tight text-stone-900",
  therapistCard:
    "group flex items-center gap-4 rounded-[18px] border border-[#ECE8E2] bg-white px-4 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.05)] transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]",
  therapistPhoto:
    "relative size-[88px] shrink-0 overflow-hidden rounded-full bg-stone-100 shadow-[0_6px_18px_rgba(0,0,0,0.12)]",
  therapistName:
    "text-[28px] font-bold leading-tight tracking-tight text-[#1A1A1A]",
  therapistRole: "text-[16px] font-normal leading-relaxed text-[#9A8E84]",
  therapistButton:
    "inline-flex h-11 w-full max-w-[220px] items-center gap-2 overflow-hidden whitespace-nowrap rounded-xl border border-white/20 bg-gradient-to-b from-[#B06FC4] to-[#8A4F9C] px-3 text-sm font-semibold tracking-[0.2px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.18)] transition-[filter,transform] duration-150 ease-out active:translate-y-px active:from-[#9B5BAF] active:to-[#7E458F] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.22)] disabled:pointer-events-none disabled:opacity-40",
  therapistButtonArrow: "",
  therapistButtonLabel: "min-w-0 flex-1 text-center pr-1.5",
  staffCard:
    "flex items-center gap-4 rounded-2xl border border-stone-200/80 bg-white px-3.5 py-4 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  staffName: "text-base font-semibold leading-snug text-stone-900",
  staffList: "space-y-4 px-4 py-5 pb-10",
  panel:
    "rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_2px_16px_-8px_rgba(0,0,0,0.08)]",
  role: "mt-0.5 text-xs font-normal leading-relaxed text-stone-500",
  helperText: "text-xs font-normal leading-relaxed text-stone-500",
  bodyMuted: "text-sm font-normal leading-relaxed text-stone-500",
  photo:
    "relative size-28 shrink-0 overflow-hidden rounded-full bg-stone-100 shadow-md ring-2 ring-stone-100",
  photoFallback:
    "flex size-full items-center justify-center bg-stone-100 text-sm font-semibold text-[#8A6A3A]",
  photoHero:
    "relative mx-auto size-28 overflow-hidden rounded-full bg-stone-100 shadow-md ring-4 ring-white",
  goldButton:
    "inline-flex h-12 w-full items-center justify-center rounded-[15px] border border-white/15 bg-gradient-to-b from-[#A07A42] to-[#6E5328] px-5 text-sm font-semibold tracking-[0.3px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),inset_0_-1px_0_rgba(0,0,0,0.2)] transition-[filter,transform] duration-150 ease-out active:translate-y-px active:from-[#8A6A3A] active:to-[#5A4420] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)] disabled:pointer-events-none disabled:opacity-40",
  mutedButton:
    "inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-[15px] border border-stone-200/70 bg-gradient-to-b from-stone-50 to-stone-100 px-3 text-sm font-semibold text-stone-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  label:
    "block text-xs font-semibold uppercase tracking-wider text-stone-600",
  field:
    "mt-1.5 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 outline-none focus:border-[#8A6A3A] focus:ring-1 focus:ring-[#8A6A3A]/25",
  backButton:
    "flex size-9 items-center justify-center rounded-full text-[#8A6A3A] hover:bg-stone-50",
  shiftBanner:
    "rounded-xl bg-stone-50 px-3 py-2.5 text-center text-sm font-normal leading-relaxed text-stone-700",
  priceBox: "rounded-xl bg-stone-50 px-4 py-4 text-center",
  priceLabel:
    "text-xs font-semibold uppercase tracking-wider text-[#8A6A3A]",
  priceValue: "mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-stone-900",
  priceValueLarge:
    "mt-2 text-3xl font-bold tabular-nums tracking-tight text-stone-900",
  successIcon: "mx-auto size-14 text-[#8A6A3A]",
  skeletonCard:
    "flex animate-pulse items-center gap-4 rounded-2xl border border-stone-100 bg-white px-3.5 py-4",
  emptyState:
    "rounded-2xl border border-stone-100 bg-stone-50 px-4 py-6 text-center text-sm font-normal leading-relaxed text-stone-500",
  errorState:
    "rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center text-sm font-normal leading-relaxed text-red-700",
  goldAccent: "text-[#8A6A3A]",
  goldChipSelected:
    "bg-gradient-to-b from-[#A07A42] to-[#72552D] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
  goldChipIdle:
    "bg-gradient-to-b from-white to-stone-100 text-sm font-semibold text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:to-stone-200/80",
  goldNextSlot: "border-[#8A6A3A]/25 bg-[#8A6A3A]/5",
} as const;
