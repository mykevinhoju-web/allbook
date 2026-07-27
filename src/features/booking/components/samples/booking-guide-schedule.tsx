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

const ROW_HEIGHT = 88;
const LABEL_WIDTH = 120;
/** How many hours fit in the first viewport. */
const VIEWPORT_HOURS = 6;
/** Past hours visible to the left of "now" on first load (now at left edge). */
const PAST_HOURS_ON_OPEN = 0;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 24; // exclusive end of calendar day window

type JumpId = "now" | "morning" | "afternoon" | "evening";

const JUMPS: { id: JumpId; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

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
  return zonedHourMs(date, 17, timeZone);
}

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
    () => zonedHourMs(date, DAY_END_HOUR, timeZone),
    [date, timeZone],
  );
  const gridWidth = ((dayEndMs - dayStartMs) / 60_000) * pxPerMinute;
  const timeMarks = useMemo(
    () => ticks(dayStartMs, dayEndMs, 30),
    [dayStartMs, dayEndMs],
  );

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
    try {
      const [staffRes, bookingRes] = await Promise.all([
        fetchAdminApi("/api/admin/staff"),
        fetchAdminApi(`/api/admin/bookings?date=${encodeURIComponent(date)}`),
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
  }, [date]);

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
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Experimental sample
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
            TV Guide schedule
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Opens at the current time. Drag or swipe sideways for earlier or
            later times.
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
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
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
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            Back to Bookings
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
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
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              activeJump === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading guide…</p>
        ) : staff.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No staff found.</p>
        ) : (
          <div
            ref={scrollerRef}
            className="max-h-[min(70vh,720px)] touch-pan-x overflow-auto overscroll-x-contain active:cursor-grabbing"
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
              <div className="sticky top-0 z-20 flex border-b border-border/70 bg-card/95 backdrop-blur">
                <div
                  className="sticky left-0 z-30 shrink-0 border-r border-border/70 bg-card px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ width: LABEL_WIDTH }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  Staff
                </div>
                <div
                  className="relative"
                  style={{ width: gridWidth, height: 44 }}
                >
                  {timeMarks.map((mark) => {
                    const left =
                      ((mark - dayStartMs) / 60_000) * pxPerMinute;
                    return (
                      <div
                        key={mark}
                        className="absolute top-0 flex h-full flex-col justify-end border-l border-border/40 px-1 pb-2"
                        style={{ left }}
                      >
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {formatAmPmTime(new Date(mark).toISOString())}
                        </span>
                      </div>
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
                      <span className="absolute left-0 top-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
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
                      className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-3"
                      style={{ width: LABEL_WIDTH }}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {rowBookings.length} booking
                        {rowBookings.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div
                      className="relative bg-muted/20"
                      style={{ width: gridWidth }}
                    >
                      {timeMarks.map((mark) => {
                        const left =
                          ((mark - dayStartMs) / 60_000) * pxPerMinute;
                        return (
                          <div
                            key={mark}
                            className="absolute inset-y-0 border-l border-border/30"
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
                          48,
                          ((Math.min(bEnd, dayEndMs) -
                            Math.max(bStart, dayStartMs)) /
                            60_000) *
                            pxPerMinute,
                        );
                        const active = Boolean(
                          booking.checkedInAt && !booking.checkedOutAt,
                        );
                        const selected = selectedId === booking.id;
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => setSelectedId(booking.id)}
                            className={cn(
                              "absolute top-2 overflow-hidden rounded-lg border px-2.5 py-2 text-left shadow-sm transition",
                              active
                                ? "border-sky-500/40 bg-sky-500/15"
                                : "border-border/80 bg-card hover:border-primary/40",
                              selected && "ring-2 ring-primary/50",
                            )}
                            style={{
                              left,
                              width,
                              height: ROW_HEIGHT - 16,
                            }}
                          >
                            <p className="truncate text-sm font-semibold text-foreground">
                              {booking.customerName?.trim() || "Guest"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatAmPmTime(booking.startsAt)}
                              {booking.roomName
                                ? ` · ${booking.roomName}`
                                : ""}
                            </p>
                            {active ? (
                              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
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
