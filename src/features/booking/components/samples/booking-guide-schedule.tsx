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
const LABEL_WIDTH = 96;
const HEADER_HEIGHT = 44;
/** Fixed guide windows: 00–06, 06–12, 12–18, 18–24. */
const BLOCK_HOURS = 6;
const BLOCKS_PER_DAY = 24 / BLOCK_HOURS; // 4
/**
 * Calendar day starts at local midnight (00:00 / 12:00 AM).
 * Next Day always opens on the 00–06 AM block.
 */
const DAY_START_HOUR = 0;

type DayBlock = 0 | 1 | 2 | 3;

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

/** TV-guide labels: "9 PM" on the hour, "9:30" on half-hours. */
function formatGuideTick(ms: number, timeZone: string): string {
  const { hour, minute } = zonedClockParts(ms, timeZone);
  const h12 = hour % 12 || 12;
  if (minute !== 0) return `${h12}:${String(minute).padStart(2, "0")}`;
  return `${h12} ${hour < 12 ? "AM" : "PM"}`;
}

function formatDayChip(dateIso: string, timeZone: string): string {
  const ms = zonedHourMs(dateIso, 12, timeZone);
  const { day, month } = zonedClockParts(ms, timeZone);
  return `${day} ${month}`;
}

function hourToBlock(hour: number): DayBlock {
  return Math.min(BLOCKS_PER_DAY - 1, Math.floor(hour / BLOCK_HOURS)) as DayBlock;
}

function blockStartHour(block: DayBlock): number {
  return block * BLOCK_HOURS;
}

function blockRangeLabel(block: DayBlock): string {
  const start = blockStartHour(block);
  const end = start + BLOCK_HOURS;
  const fmt = (h: number) => {
    if (h === 0 || h === 24) return "12 AM";
    if (h === 12) return "12 PM";
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };
  return `${fmt(start)}–${fmt(end === 24 ? 0 : end)}`;
}

function isAmBlock(block: DayBlock): boolean {
  // 00–06 and 06–12 = AM; 12–18 and 18–24 = PM
  return block < 2;
}

function ticks(startMs: number, endMs: number, stepMin = 30): number[] {
  const step = stepMin * 60_000;
  const first = Math.ceil(startMs / step) * step;
  const out: number[] = [];
  for (let t = first; t < endMs; t += step) out.push(t);
  return out;
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
  const [block, setBlock] = useState<DayBlock>(0);

  const didInitView = useRef(false);
  const pendingEndRef = useRef(false);

  const viewStartMs = zonedHourMs(date, blockStartHour(block), timeZone);
  const viewportMs = BLOCK_HOURS * 60 * 60_000;
  const viewEndMs = viewStartMs + viewportMs;
  const timeMarks = useMemo(
    () => ticks(viewStartMs, viewEndMs, 30),
    [viewStartMs, viewEndMs],
  );

  const pct = (ms: number) => ((ms - viewStartMs) / viewportMs) * 100;

  const amWindow = isAmBlock(block);
  const nearDayEnd = block === BLOCKS_PER_DAY - 1;
  const atDayStart = block === 0;

  const load = useCallback(async () => {
    setLoading(true);
    didInitView.current = false;
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

  // Open on the 6h block that contains "now" (or 00–06 for other days).
  useEffect(() => {
    if (loading || didInitView.current || pendingEndRef.current) return;
    const today = todayDateInZone(timeZone, now);
    if (date === today) {
      const hour = zonedClockParts(now.getTime(), timeZone).hour;
      setBlock(hourToBlock(hour));
    } else {
      setBlock(0);
    }
    didInitView.current = true;
  }, [loading, date, timeZone, now]);

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

  const goPrev = () => {
    if (atDayStart) {
      pendingEndRef.current = true;
      setDate(addDaysIso(date, -1));
      didInitView.current = false;
      return;
    }
    setBlock((b) => (b - 1) as DayBlock);
  };

  const goNextOrNextDay = () => {
    if (nearDayEnd) {
      // Next calendar day → 00–06 AM block.
      pendingEndRef.current = false;
      setDate(addDaysIso(date, 1));
      setBlock(0);
      didInitView.current = false;
      return;
    }
    setBlock((b) => (b + 1) as DayBlock);
  };

  useEffect(() => {
    if (loading || !pendingEndRef.current) return;
    pendingEndRef.current = false;
    setBlock((BLOCKS_PER_DAY - 1) as DayBlock);
    didInitView.current = true;
  }, [loading, date]);

  const jumpToNow = () => {
    const today = todayDateInZone(timeZone, now);
    if (date !== today) {
      setDate(today);
      didInitView.current = false;
      return;
    }
    setBlock(hourToBlock(zonedClockParts(now.getTime(), timeZone).hour));
  };

  const nowPct =
    now.getTime() >= viewStartMs && now.getTime() <= viewEndMs
      ? pct(now.getTime())
      : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:gap-4 md:p-6">
      <div className="flex shrink-0 flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight md:text-2xl">
            TV Guide schedule
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground md:text-sm">
            {formatDayChip(date, timeZone)} · blocks 00–06 / 06–12 / 12–18 /
            18–24 · Next Day → 00–06
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={jumpToNow}
            className="h-9 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            Now
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              didInitView.current = false;
              setDate(e.target.value);
            }}
            className="h-9 rounded-xl border border-border bg-card px-2 text-sm"
          />
          <Link
            href="/admin/bookings"
            className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-3 text-sm font-medium hover:bg-muted"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading guide…</p>
        ) : staff.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No staff found.</p>
        ) : (
          <div className="flex h-full max-h-[min(58vh,560px)] flex-col md:max-h-[min(65vh,640px)]">
            {/* Time rail with TV-guide style prev / next */}
            <div
              className="relative flex shrink-0 items-stretch border-b border-border/70"
              style={{ height: HEADER_HEIGHT }}
            >
              <div
                className="flex shrink-0 items-end border-r border-border/70 bg-card px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                style={{ width: LABEL_WIDTH }}
              >
                Staff
              </div>
              <div
                className={cn(
                  "relative min-w-0 flex-1",
                  amWindow ? "bg-sky-500/10" : "bg-amber-500/10",
                )}
              >
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-0 top-0 z-20 flex h-full w-9 items-center justify-center bg-teal-700 text-white hover:bg-teal-800"
                  aria-label={atDayStart ? "Previous day" : "Earlier"}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={goNextOrNextDay}
                  className={cn(
                    "absolute right-0 top-0 z-20 flex h-full items-center justify-center gap-1 bg-teal-700 px-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-teal-800",
                    nearDayEnd ? "min-w-[5.5rem]" : "w-9",
                  )}
                  aria-label={nearDayEnd ? "Next day" : "Later"}
                >
                  {nearDayEnd ? (
                    <>
                      Next Day
                      <ChevronRight className="size-4" />
                    </>
                  ) : (
                    <ChevronRight className="size-5" />
                  )}
                </button>

                <div className="pointer-events-none absolute left-10 top-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {amWindow ? "AM" : "PM"} · {blockRangeLabel(block)} ·{" "}
                  {formatDayChip(date, timeZone)}
                </div>
                {timeMarks.map((mark) => {
                  const { minute } = zonedClockParts(mark, timeZone);
                  return (
                    <div
                      key={mark}
                      className="absolute inset-y-0 border-l border-border/30"
                      style={{ left: `${pct(mark)}%` }}
                    >
                      <span
                        className={cn(
                          "absolute bottom-1 left-1 whitespace-nowrap text-[11px] tabular-nums",
                          minute === 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatGuideTick(mark, timeZone)}
                      </span>
                    </div>
                  );
                })}
                {nowPct != null ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-500"
                    style={{ left: `${nowPct}%` }}
                  >
                    <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {formatAmPmTime(now.toISOString())}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {staff.map((member) => {
                const rowBookings = bookingsByStaff.get(member.id) ?? [];
                return (
                  <div
                    key={member.id}
                    className="flex border-b border-border/50 last:border-b-0"
                    style={{ height: ROW_HEIGHT }}
                  >
                    <div
                      className="flex shrink-0 flex-col justify-center border-r border-border/70 bg-card px-2.5"
                      style={{ width: LABEL_WIDTH }}
                    >
                      <p className="truncate text-sm font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {rowBookings.length} booking
                        {rowBookings.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="relative min-w-0 flex-1 bg-muted/15">
                      {timeMarks.map((mark) => {
                        const { minute } = zonedClockParts(mark, timeZone);
                        return (
                          <div
                            key={mark}
                            className={cn(
                              "absolute inset-y-0 border-l",
                              minute === 0
                                ? "border-border/35"
                                : "border-border/20",
                            )}
                            style={{ left: `${pct(mark)}%` }}
                          />
                        );
                      })}
                      {nowPct != null ? (
                        <div
                          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-sky-500"
                          style={{ left: `${nowPct}%` }}
                        />
                      ) : null}
                      {rowBookings.map((booking) => {
                        const bStart = new Date(booking.startsAt).getTime();
                        const bEnd = new Date(booking.endsAt).getTime();
                        if (bEnd <= viewStartMs || bStart >= viewEndMs) {
                          return null;
                        }
                        const leftPct = pct(Math.max(bStart, viewStartMs));
                        const widthPct = Math.max(
                          4,
                          ((Math.min(bEnd, viewEndMs) -
                            Math.max(bStart, viewStartMs)) /
                            viewportMs) *
                            100,
                        );
                        const active = isBookingCheckedIn(booking);
                        const selected = selectedId === booking.id;
                        return (
                          <button
                            key={booking.id}
                            type="button"
                            onClick={() => setSelectedId(booking.id)}
                            className={cn(
                              "absolute top-1.5 overflow-hidden rounded-lg border px-2 py-1.5 text-left shadow-sm transition",
                              active
                                ? "border-sky-500/40 bg-sky-500/15"
                                : "border-border/80 bg-card hover:border-primary/40",
                              selected && "ring-2 ring-primary/50",
                            )}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
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
