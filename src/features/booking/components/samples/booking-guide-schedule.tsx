"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";
import { cn } from "@/lib/utils";
import { useNowTick } from "@/hooks/use-now-tick";

import {
  formatAmPmTime,
  formatBookingSummary,
  todayDateInZone,
} from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";
import { isBookingCheckedIn } from "../../lib/booking-check-in";

const ROW_HEIGHT = 72;
const LABEL_WIDTH = 104;
const HEADER_HEIGHT = 52;
/** How many hours fit in the visible timeline window. */
const VIEWPORT_HOURS = 6;
/** Past hours visible to the left of "now" on first load (now at left edge). */
const PAST_HOURS_ON_OPEN = 0;
const DAY_START_HOUR = 6;
/** Timeline continues into next morning so midnight is not cut off. */
const OVERNIGHT_END_HOUR = 6;

type JumpId = "now" | "morning" | "afternoon" | "evening" | "overnight";

const JUMPS: { id: JumpId; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "overnight", label: "Overnight" },
];

function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y!, m! - 1, d! + days));
  return next.toISOString().slice(0, 10);
}

function zonedHourMs(date: string, hour: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let guess = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    hour,
    0,
    0,
  );
  for (let i = 0; i < 3; i++) {
    const parts = dtf.formatToParts(new Date(guess));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asLocal = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const target = Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      hour,
      0,
      0,
    );
    guess += target - asLocal;
  }
  return guess;
}

function zonedClockParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return {
    hour,
    minute,
    day: get("day"),
    month: get("month"),
  };
}

/** Compact hour label for dense tablet headers, e.g. 10p / 12a. */
function formatCompactHour(ms: number, timeZone: string): string {
  const { hour } = zonedClockParts(ms, timeZone);
  const h12 = hour % 12 || 12;
  return `${h12}${hour < 12 ? "a" : "p"}`;
}

function formatDayChip(dateIso: string, timeZone: string): string {
  const ms = zonedHourMs(dateIso, 12, timeZone);
  const { day, month } = zonedClockParts(ms, timeZone);
  return `${day} ${month}`;
}

function ticks(startMs: number, endMs: number, stepMin = 30): number[] {
  const step = stepMin * 60_000;
  const first = Math.ceil(startMs / step) * step;
  const out: number[] = [];
  for (let t = first; t < endMs; t += step) out.push(t);
  return out;
}

function jumpTargetMs(
  id: JumpId,
  date: string,
  timeZone: string,
  now: Date,
): number {
  if (id === "now") return now.getTime();
  if (id === "morning") return zonedHourMs(date, 6, timeZone);
  if (id === "afternoon") return zonedHourMs(date, 12, timeZone);
  if (id === "evening") return zonedHourMs(date, 17, timeZone);
  return zonedHourMs(date, 22, timeZone);
}

type AmPmBand = {
  key: string;
  left: number;
  width: number;
  period: "am" | "pm";
  dateLabel: string | null;
};

export function BookingGuideScheduleSample() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const now = useNowTick(30_000);
  const [date, setDate] = useState(() => todayDateInZone(timeZone));
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pxPerMinute, setPxPerMinute] = useState(2.2);
  const [activeJump, setActiveJump] = useState<JumpId>("now");

  const scrollerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);

  const dayStartMs = useMemo(
    () => zonedHourMs(date, DAY_START_HOUR, timeZone),
    [date, timeZone],
  );
  const dayEndMs = useMemo(
    () => zonedHourMs(addDaysIso(date, 1), OVERNIGHT_END_HOUR, timeZone),
    [date, timeZone],
  );
  const gridWidth = ((dayEndMs - dayStartMs) / 60_000) * pxPerMinute;
  const timeMarks = useMemo(
    () => ticks(dayStartMs, dayEndMs, 30),
    [dayStartMs, dayEndMs],
  );
  const hourMarks = useMemo(
    () => timeMarks.filter((mark) => zonedClockParts(mark, timeZone).minute === 0),
    [timeMarks, timeZone],
  );
  const amPmBands = useMemo((): AmPmBand[] => {
    const noonMs = zonedHourMs(date, 12, timeZone);
    const midnightMs = zonedHourMs(addDaysIso(date, 1), 0, timeZone);
    const nextDate = addDaysIso(date, 1);
    const toBand = (
      key: string,
      start: number,
      end: number,
      period: "am" | "pm",
      dateLabel: string | null,
    ): AmPmBand | null => {
      const leftMs = Math.max(start, dayStartMs);
      const rightMs = Math.min(end, dayEndMs);
      if (rightMs <= leftMs) return null;
      return {
        key,
        left: ((leftMs - dayStartMs) / 60_000) * pxPerMinute,
        width: ((rightMs - leftMs) / 60_000) * pxPerMinute,
        period,
        dateLabel,
      };
    };
    return [
      toBand("am-today", dayStartMs, noonMs, "am", formatDayChip(date, timeZone)),
      toBand("pm-today", noonMs, midnightMs, "pm", null),
      toBand(
        "am-next",
        midnightMs,
        dayEndMs,
        "am",
        formatDayChip(nextDate, timeZone),
      ),
    ].filter((band): band is AmPmBand => band != null);
  }, [date, dayStartMs, dayEndMs, pxPerMinute, timeZone]);

  const scrollToTime = useCallback(
    (
      targetMs: number,
      behavior: ScrollBehavior = "smooth",
      align: "start" | "center" | "past" = "start",
      ppm = pxPerMinute,
    ) => {
      const el = scrollerRef.current;
      if (!el) return;
      const targetLeft = ((targetMs - dayStartMs) / 60_000) * ppm;
      const visible = Math.max(280, el.clientWidth - LABEL_WIDTH);
      let left = targetLeft;
      if (align === "center") {
        left = targetLeft - visible / 2;
      } else if (align === "past") {
        left = targetLeft - PAST_HOURS_ON_OPEN * 60 * ppm;
      }
      el.scrollTo({ left: Math.max(0, left), behavior });
    },
    [dayStartMs, pxPerMinute],
  );

  const load = useCallback(async () => {
    setLoading(true);
    didInitialScroll.current = false;
    const from = new Date(
      zonedHourMs(date, DAY_START_HOUR, timeZone),
    ).toISOString();
    const to = new Date(
      zonedHourMs(addDaysIso(date, 1), OVERNIGHT_END_HOUR, timeZone),
    ).toISOString();
    try {
      const [staffRes, bookingRes] = await Promise.all([
        fetchAdminApi("/api/admin/staff"),
        fetchAdminApi(
          `/api/admin/bookings?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        ),
      ]);
      if (staffRes.ok) {
        const data = (await staffRes.json()) as { staff?: StaffRecord[] };
        setStaff(data.staff ?? []);
      }
      if (bookingRes.ok) {
        const data = (await bookingRes.json()) as { bookings?: AdminBooking[] };
        setBookings(data.bookings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [date, timeZone]);

  useEffect(() => {
    void load();
  }, [load]);

  // Measure scale, then scroll so "now" is at the left edge of the timeline.
  useEffect(() => {
    if (loading) return;
    const el = scrollerRef.current;
    if (!el) return;

    const measurePpm = () => {
      const visible = Math.max(280, el.clientWidth - LABEL_WIDTH);
      return visible / (VIEWPORT_HOURS * 60);
    };

    const scrollInitial = (ppm: number) => {
      if (didInitialScroll.current) return;
      const today = todayDateInZone(timeZone);
      if (date === today) {
        scrollToTime(Date.now(), "auto", "start", ppm);
        setActiveJump("now");
      } else {
        scrollToTime(
          zonedHourMs(date, DAY_START_HOUR, timeZone),
          "auto",
          "start",
          ppm,
        );
        setActiveJump("morning");
      }
      didInitialScroll.current = true;
    };

    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const ppm = measurePpm();
        setPxPerMinute(ppm);
        scrollInitial(ppm);
      });
    });

    const ro = new ResizeObserver(() => {
      const ppm = measurePpm();
      setPxPerMinute(ppm);
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [loading, date, timeZone, staff.length, scrollToTime]);

  const bookingsByStaff = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;
      const list = map.get(booking.staffId) ?? [];
      list.push(booking);
      map.set(booking.staffId, list);
    }
    return map;
  }, [bookings]);

  const shiftDate = (delta: number) => {
    const [y, m, d] = date.split("-").map(Number);
    const next = new Date(Date.UTC(y!, m! - 1, d! + delta));
    setDate(next.toISOString().slice(0, 10));
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    // Don't start drag from staff label clicks / booking buttons — those stopPropagation.
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag?.active || !el) return;
    const dx = event.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    el.scrollLeft = drag.startScroll - dx;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (drag?.active && el?.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:gap-4 md:p-6">
      <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-end md:justify-between md:gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight md:text-2xl">
            TV Guide schedule
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            6-hour window · drag sideways · Overnight for midnight
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => shiftDate(-1)}
          >
            <ChevronLeft className="size-4" />
          </AppButton>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-xl border border-border bg-card px-2 text-sm md:h-10 md:px-3"
          />
          <AppButton
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => shiftDate(1)}
          >
            <ChevronRight className="size-4" />
          </AppButton>
          <Link
            href="/admin/bookings"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-muted md:h-10"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5">
        {JUMPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveJump(item.id);
              const target = jumpTargetMs(item.id, date, timeZone, now);
              scrollToTime(target, "smooth", "start");
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition md:px-3 md:py-1.5 md:text-sm",
              activeJump === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading guide…</p>
        ) : staff.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No staff found.</p>
        ) : (
          <div
            ref={scrollerRef}
            className="h-full max-h-[min(58vh,560px)] touch-pan-x overflow-auto overscroll-x-contain active:cursor-grabbing md:max-h-[min(65vh,640px)]"
            style={{ cursor: "grab", WebkitOverflowScrolling: "touch" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div
              className="relative"
              style={{ width: LABEL_WIDTH + gridWidth }}
            >
              <div
                className="sticky top-0 z-20 flex border-b border-border/70 bg-card"
                style={{ height: HEADER_HEIGHT }}
              >
                <div
                  className="sticky left-0 z-30 flex shrink-0 items-end border-r border-border/70 bg-card px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ width: LABEL_WIDTH }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Staff
                </div>
                <div
                  className="relative"
                  style={{ width: gridWidth, height: HEADER_HEIGHT }}
                >
                  {amPmBands.map((band) => (
                    <div
                      key={band.key}
                      className={cn(
                        "absolute top-0 flex h-[18px] items-center overflow-hidden border-r border-border/30 px-1.5",
                        band.period === "am"
                          ? "bg-sky-500/15 text-sky-900"
                          : "bg-amber-500/15 text-amber-950",
                      )}
                      style={{ left: band.left, width: band.width }}
                    >
                      <span className="truncate text-[9px] font-bold uppercase tracking-wider">
                        {band.period}
                        {band.dateLabel ? ` · ${band.dateLabel}` : ""}
                      </span>
                    </div>
                  ))}

                  {timeMarks.map((mark) => {
                    const { minute } = zonedClockParts(mark, timeZone);
                    const left =
                      ((mark - dayStartMs) / 60_000) * pxPerMinute;
                    return (
                      <div
                        key={mark}
                        className={cn(
                          "absolute bottom-0 border-l",
                          minute === 0
                            ? "h-[34px] border-border/50"
                            : "h-[18px] border-border/25",
                        )}
                        style={{ left }}
                      />
                    );
                  })}

                  {hourMarks.map((mark) => {
                    const left =
                      ((mark - dayStartMs) / 60_000) * pxPerMinute;
                    return (
                      <span
                        key={`h-${mark}`}
                        className="absolute bottom-1 -translate-x-1/2 text-[10px] font-semibold tabular-nums text-foreground/80"
                        style={{ left }}
                      >
                        {formatCompactHour(mark, timeZone)}
                      </span>
                    );
                  })}

                  {now.getTime() >= dayStartMs &&
                  now.getTime() <= dayEndMs ? (
                    <div
                      className="pointer-events-none absolute top-0 z-20 h-full"
                      style={{
                        left:
                          ((now.getTime() - dayStartMs) / 60_000) *
                          pxPerMinute,
                      }}
                    >
                      <span className="absolute left-0 top-[18px] -translate-x-1/2 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        {formatAmPmTime(now.toISOString())}
                      </span>
                      <div className="absolute inset-y-0 left-0 w-0.5 -translate-x-1/2 bg-sky-500" />
                    </div>
                  ) : null}
                </div>
              </div>

              {staff.map((member) => {
                const rowBookings = bookingsByStaff.get(member.id) ?? [];
                return (
                  <div
                    key={member.id}
                    className="flex border-b border-border/50 last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-2.5"
                      style={{ width: LABEL_WIDTH }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {rowBookings.length} booking
                        {rowBookings.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div
                      className="relative bg-muted/20"
                      style={{ width: gridWidth }}
                    >
                      {amPmBands.map((band) => (
                        <div
                          key={`${member.id}-${band.key}`}
                          className={cn(
                            "absolute inset-y-0",
                            band.period === "am"
                              ? "bg-sky-500/[0.04]"
                              : "bg-amber-500/[0.04]",
                          )}
                          style={{ left: band.left, width: band.width }}
                        />
                      ))}
                      {timeMarks.map((mark) => {
                        const { minute } = zonedClockParts(mark, timeZone);
                        const left =
                          ((mark - dayStartMs) / 60_000) * pxPerMinute;
                        return (
                          <div
                            key={mark}
                            className={cn(
                              "absolute inset-y-0 border-l",
                              minute === 0
                                ? "border-border/35"
                                : "border-border/20",
                            )}
                            style={{ left }}
                          />
                        );
                      })}
                      {now.getTime() >= dayStartMs &&
                      now.getTime() <= dayEndMs ? (
                        <div
                          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-500"
                          style={{
                            left:
                              ((now.getTime() - dayStartMs) / 60_000) *
                              pxPerMinute,
                          }}
                        />
                      ) : null}

                      {rowBookings.map((booking) => {
                        const bStart = new Date(booking.startsAt).getTime();
                        const bEnd = new Date(booking.endsAt).getTime();
                        if (bEnd <= dayStartMs || bStart >= dayEndMs) {
                          return null;
                        }
                        const left =
                          ((Math.max(bStart, dayStartMs) - dayStartMs) /
                            60_000) *
                          pxPerMinute;
                        const width = Math.max(
                          36,
                          ((Math.min(bEnd, dayEndMs) -
                            Math.max(bStart, dayStartMs)) /
                            60_000) *
                            pxPerMinute,
                        );
                        const active = isBookingCheckedIn(booking);
                        const selected = selectedId === booking.id;
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setSelectedId(booking.id)}
                            className={cn(
                              "absolute top-1.5 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition",
                              active
                                ? "border-sky-500/40 bg-sky-500/15"
                                : "border-border/80 bg-card hover:border-primary/40",
                              selected && "ring-2 ring-primary/50",
                            )}
                            style={{
                              left,
                              width,
                              height: ROW_HEIGHT - 12,
                            }}
                          >
                            <p className="truncate text-sm font-semibold text-foreground">
                              {booking.customerName?.trim() || "Guest"}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {formatAmPmTime(booking.startsAt)}
                              {booking.roomName
                                ? ` · ${booking.roomName}`
                                : ""}
                            </p>
                            {active ? (
                              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                In service
                              </p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedId ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GuideBookingBriefCard
              booking={bookings.find((b) => b.id === selectedId) ?? null}
              timeZone={timeZone}
              onClose={() => setSelectedId(null)}
              onCancelled={() => {
                setSelectedId(null);
                void load();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatGuideDateTime(iso: string): string {
  const date = new Date(iso);
  const time = formatAmPmTime(iso);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${time} · ${dd}/${mm}/${yy}`;
}

function GuideBookingBriefCard({
  booking,
  onClose,
  onCancelled,
}: {
  booking: AdminBooking | null;
  timeZone: string;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);

  if (!booking) return null;

  const canCancel =
    booking.status !== "cancelled" &&
    booking.status !== "completed" &&
    !booking.checkedOutAt;

  const cancelBooking = async () => {
    if (!canCancel || cancelling) return;
    const confirmed = window.confirm(
      "Cancel this booking? The time slot will become available again.",
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const response = await fetchAdminApi(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error("Could not cancel", { description: data.error });
        return;
      }
      toast.success("Booking cancelled");
      onCancelled();
    } catch {
      toast.error("Could not cancel", { description: "Network error." });
    } finally {
      setCancelling(false);
    }
  };

  const guestBits = [
    booking.customerPhone,
    booking.customerEmail,
    booking.customerPostcode,
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft-lg">
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Staff
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {booking.staffName}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Service time
          </p>
          <p className="mt-0.5 text-foreground">
            {formatBookingSummary(booking)}
            {booking.roomName ? ` · ${booking.roomName}` : ""}
            {isBookingCheckedIn(booking) ? " · In service" : ""}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Guest
          </p>
          <p className="mt-0.5 font-medium text-foreground">
            {booking.customerName?.trim() || "Guest"}
          </p>
          <p className="text-muted-foreground">
            {formatGuideDateTime(booking.startsAt)}
          </p>
        </div>
        {guestBits.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Guest info
            </p>
            <p className="mt-0.5 text-foreground">{guestBits.join(" · ")}</p>
          </div>
        ) : null}
        {booking.notes?.trim() ? (
          <p className="text-muted-foreground">{booking.notes.trim()}</p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canCancel ? (
          <AppButton
            type="button"
            variant="danger"
            className="rounded-xl"
            disabled={cancelling}
            onClick={() => void cancelBooking()}
          >
            {cancelling ? "Cancelling…" : "Cancel"}
          </AppButton>
        ) : null}
        <AppButton
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onClose}
        >
          Close
        </AppButton>
      </div>
    </div>
  );
}
