"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { AppButton } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { useTenant } from "@/features/tenants";
import type { StaffRecord } from "@/features/staff/types";
import { cn } from "@/lib/utils";
import { useNowTick } from "@/hooks/use-now-tick";

import { formatAmPmTime, todayDateInZone } from "../../lib/schedule-utils";
import type { AdminBooking } from "../../types/admin-booking";

type DayPart = "now" | "morning" | "afternoon" | "evening" | "full";

const PX_PER_MINUTE = 2.4;
const ROW_HEIGHT = 88;
const LABEL_WIDTH = 128;

const DAY_PARTS: { id: DayPart; label: string }[] = [
  { id: "now", label: "Now" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "full", label: "All day" },
];

function zonedHourMs(date: string, hour: number, timeZone: string): number {
  // Approximate via datetime-local conversion pattern used elsewhere
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = `${date}T${pad(hour)}:00:00`;
  // Interpret as tenant-local wall time → UTC via Date parsing with offset guess
  // Use the same approach as schedule: format in zone
  const probe = new Date(`${local}Z`);
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
  // Binary-search style: start from UTC guess of that local time
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
  void probe;
  return guess;
}

function windowForPart(
  part: DayPart,
  date: string,
  timeZone: string,
  now: Date,
): { startMs: number; endMs: number } {
  if (part === "morning") {
    return {
      startMs: zonedHourMs(date, 6, timeZone),
      endMs: zonedHourMs(date, 12, timeZone),
    };
  }
  if (part === "afternoon") {
    return {
      startMs: zonedHourMs(date, 12, timeZone),
      endMs: zonedHourMs(date, 17, timeZone),
    };
  }
  if (part === "evening") {
    return {
      startMs: zonedHourMs(date, 17, timeZone),
      endMs: zonedHourMs(date, 23, timeZone),
    };
  }
  if (part === "now") {
    const start = now.getTime() - 30 * 60_000;
    return { startMs: start, endMs: start + 5 * 60 * 60_000 };
  }
  return {
    startMs: zonedHourMs(date, 6, timeZone),
    endMs: zonedHourMs(date, 23, timeZone) + 60 * 60_000,
  };
}

function ticks(startMs: number, endMs: number, stepMin = 30): number[] {
  const step = stepMin * 60_000;
  const first = Math.ceil(startMs / step) * step;
  const out: number[] = [];
  for (let t = first; t <= endMs; t += step) out.push(t);
  return out;
}

export function BookingGuideScheduleSample() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const now = useNowTick(30_000);
  const [date, setDate] = useState(() => todayDateInZone(timeZone));
  const [part, setPart] = useState<DayPart>("evening");
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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

  const { startMs, endMs } = useMemo(
    () => windowForPart(part, date, timeZone, now),
    [part, date, timeZone, now],
  );
  const durationMs = Math.max(endMs - startMs, 60_000);
  const gridWidth = (durationMs / 60_000) * PX_PER_MINUTE;
  const timeMarks = useMemo(() => ticks(startMs, endMs, 30), [startMs, endMs]);

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
            Staff rows × time columns, with booking blocks sized by duration.
            Live data from today — not wired into the main Bookings page yet.
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
        {DAY_PARTS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPart(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              part === item.id
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
          <div className="overflow-auto">
            <div
              className="relative min-w-full"
              style={{ width: LABEL_WIDTH + gridWidth }}
            >
              {/* Time header */}
              <div className="sticky top-0 z-20 flex border-b border-border/70 bg-card/95 backdrop-blur">
                <div
                  className="sticky left-0 z-30 shrink-0 border-r border-border/70 bg-card px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  style={{ width: LABEL_WIDTH }}
                >
                  Staff
                </div>
                <div className="relative" style={{ width: gridWidth, height: 44 }}>
                  {timeMarks.map((mark) => {
                    const left = ((mark - startMs) / 60_000) * PX_PER_MINUTE;
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
                  {/* now line in header */}
                  {now.getTime() >= startMs && now.getTime() <= endMs ? (
                    <div
                      className="absolute top-0 z-10 h-full w-0.5 bg-sky-500"
                      style={{
                        left:
                          ((now.getTime() - startMs) / 60_000) * PX_PER_MINUTE,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Rows */}
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
                      {/* half-hour grid lines */}
                      {timeMarks.map((mark) => {
                        const left =
                          ((mark - startMs) / 60_000) * PX_PER_MINUTE;
                        return (
                          <div
                            key={mark}
                            className="absolute inset-y-0 border-l border-border/30"
                            style={{ left }}
                          />
                        );
                      })}
                      {now.getTime() >= startMs && now.getTime() <= endMs ? (
                        <div
                          className="absolute inset-y-0 z-10 w-0.5 bg-sky-500/80"
                          style={{
                            left:
                              ((now.getTime() - startMs) / 60_000) *
                              PX_PER_MINUTE,
                          }}
                        />
                      ) : null}

                      {rowBookings.map((booking) => {
                        const bStart = new Date(booking.startsAt).getTime();
                        const bEnd = new Date(booking.endsAt).getTime();
                        if (bEnd <= startMs || bStart >= endMs) return null;
                        const left =
                          ((Math.max(bStart, startMs) - startMs) / 60_000) *
                          PX_PER_MINUTE;
                        const width = Math.max(
                          48,
                          ((Math.min(bEnd, endMs) - Math.max(bStart, startMs)) /
                            60_000) *
                            PX_PER_MINUTE,
                        );
                        const active = Boolean(
                          booking.checkedInAt && !booking.checkedOutAt,
                        );
                        const selected = selectedId === booking.id;
                        return (
                          <button
                            key={booking.id}
                            type="button"
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
        <SelectedBookingCard
          booking={bookings.find((b) => b.id === selectedId) ?? null}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function SelectedBookingCard({
  booking,
  onClose,
}: {
  booking: AdminBooking | null;
  onClose: () => void;
}) {
  if (!booking) return null;
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-soft md:max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {booking.customerName?.trim() || "Guest"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.staffName} · {formatAmPmTime(booking.startsAt)}–
            {formatAmPmTime(booking.endsAt)}
            {booking.roomName ? ` · ${booking.roomName}` : ""}
          </p>
        </div>
        <AppButton
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={onClose}
        >
          Close
        </AppButton>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Sample only — tap blocks here to inspect. Creating/editing still happens
        on the main Bookings page.
      </p>
    </div>
  );
}
