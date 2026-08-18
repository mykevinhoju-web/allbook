"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Loader2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { ReportBookingTypeBadge } from "@/features/admin/components/report-booking-type-badge";
import {
  ReportCashCardSplit,
  ReportPaymentIcons,
} from "@/features/admin/components/report-payment-icons";
import type { RevenueDailyTotal } from "@/features/admin/lib/revenue-report";
import {
  addDaysToDateInput,
  formatAmPmTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { formatPriceFromCents } from "@/features/services";
import { useTenant } from "@/features/tenants";

import { fetchStaffApi } from "../lib/staff-api-client";
import { StaffPortalTabs } from "./staff-portal-tabs";

type RevenueResponse = {
  currency: string;
  timezone: string;
  from: string;
  to: string;
  grandTotalCents: number;
  staffPayoutTotalCents: number;
  staffPayoutCashCents: number;
  staffPayoutCardCents: number;
  shopTotalCents: number;
  cashTotalCents: number;
  cardTotalCents: number;
  bookingCount: number;
  dailyTotals: RevenueDailyTotal[];
  error?: string;
};

function monthStartDate(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

function serviceLabel(minutes: number): string {
  return minutes > 0 ? `${minutes} min` : "Service";
}

function formatDayLabel(date: string, timeZone: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const utc = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1, 12, 0, 0));
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(utc);
}

export function StaffReportsContent() {
  const tenant = useTenant();
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const tenantCurrency = tenant.settings.currency || "AUD";
  const today = useMemo(() => todayDateInZone(timeZone), [timeZone]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFrom(today);
    setTo(today);
  }, [today]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetchStaffApi(
        `/api/staff/reports/revenue?${params.toString()}`,
      );
      const data = (await response.json()) as RevenueResponse;
      if (!response.ok) {
        toast.error("Could not load report", {
          description: data.error ?? "Try again.",
        });
        setReport(null);
        return;
      }
      setReport(data);
    } catch {
      toast.error("Could not load report", {
        description: "Network error. Try again.",
      });
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const currency = report?.currency ?? tenantCurrency;
  const splitTotalCents = useMemo(() => {
    if (!report) return 0;
    return report.dailyTotals.reduce((sum, day) => {
      return (
        sum +
        day.bookings.reduce((daySum, booking) => {
          if (booking.cashCents > 0 && booking.cardCents > 0) {
            return daySum + booking.priceCents;
          }
          return daySum;
        }, 0)
      );
    }, 0);
  }, [report]);
  const byService = useMemo(() => {
    if (!report) return [];
    const map = new Map<
      number,
      {
        durationMinutes: number;
        count: number;
        salesCents: number;
        takeCents: number;
        takeCashCents: number;
        takeCardCents: number;
      }
    >();
    for (const day of report.dailyTotals) {
      for (const booking of day.bookings) {
        const durationMinutes = booking.durationMinutes || 0;
        const row = map.get(durationMinutes) ?? {
          durationMinutes,
          count: 0,
          salesCents: 0,
          takeCents: 0,
          takeCashCents: 0,
          takeCardCents: 0,
        };
        row.count += 1;
        row.salesCents += booking.priceCents;
        row.takeCents += booking.staffPayoutCents;
        row.takeCashCents += booking.staffPayoutCashCents;
        row.takeCardCents += booking.staffPayoutCardCents;
        map.set(durationMinutes, row);
      }
    }
    return [...map.values()].sort(
      (a, b) => a.durationMinutes - b.durationMinutes,
    );
  }, [report]);
  const applyPreset = (preset: "today" | "7d" | "month") => {
    if (preset === "today") {
      setFrom(today);
      setTo(today);
      return;
    }
    if (preset === "7d") {
      setFrom(addDaysToDateInput(today, -6));
      setTo(today);
      return;
    }
    setFrom(monthStartDate(today));
    setTo(today);
  };

  return (
    <div className="space-y-4">
      <StaffPortalTabs active="report" />

      <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
        <p className="text-sm font-semibold">My report</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Your bookings only · same date range as admin reports.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["today", "Today"],
              ["7d", "Week"],
              ["month", "This month"],
            ] as const
          ).map(([key, label]) => (
            <AppButton
              key={key}
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => applyPreset(key)}
            >
              {label}
            </AppButton>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">From</span>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">To</span>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              className="h-11 rounded-xl"
            />
          </label>
        </div>
        <AppButton
          type="button"
          className="mt-3 h-11 w-full rounded-xl"
          onClick={() => void loadReport()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Apply"}
        </AppButton>
      </section>

      <section className="grid grid-cols-1 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total sales</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">
                {loading && !report
                  ? "—"
                  : formatPriceFromCents(report?.grandTotalCents ?? 0, currency)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {from === to ? from : `${from} → ${to}`} ·{" "}
                {report?.bookingCount ?? 0} booking
                {(report?.bookingCount ?? 0) === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="size-4" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Your take</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-3xl font-semibold tabular-nums">
              {loading && !report
                ? "—"
                : formatPriceFromCents(
                    report?.staffPayoutTotalCents ?? 0,
                    currency,
                  )}
            </p>
            <ReportCashCardSplit
              cashCents={report?.staffPayoutCashCents ?? 0}
              cardCents={report?.staffPayoutCardCents ?? 0}
              currency={currency}
              loading={Boolean(loading && !report)}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Amount you keep · cash vs card
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Cash</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {loading && !report
              ? "—"
              : formatPriceFromCents(report?.cashTotalCents ?? 0, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Card</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {loading && !report
              ? "—"
              : formatPriceFromCents(report?.cardTotalCents ?? 0, currency)}
          </p>
        </div>
        {splitTotalCents > 0 ? (
          <div className="col-span-2 rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
            <p className="text-sm text-muted-foreground">Split</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatPriceFromCents(splitTotalCents, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cash + card in the same booking
            </p>
          </div>
        ) : null}
      </section>

      {loading && !report ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : !report || report.dailyTotals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
          No paid bookings in this period.
        </div>
      ) : (
        <>
          {byService.length > 0 ? (
            <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold">By service</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your take for each duration, cash vs card
              </p>
              <ul className="mt-3 overflow-hidden rounded-xl border border-border/40">
                <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Service</span>
                  <span className="text-right">Your take</span>
                </li>
                {byService.map((row) => (
                  <li
                    key={row.durationMinutes}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-t border-border/40 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {serviceLabel(row.durationMinutes)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.count} booking{row.count === 1 ? "" : "s"} · sales{" "}
                        {formatPriceFromCents(row.salesCents, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatPriceFromCents(row.takeCents, currency)}
                      </p>
                      <ReportCashCardSplit
                        cashCents={row.takeCashCents}
                        cardCents={row.takeCardCents}
                        currency={currency}
                      />
                    </div>
                  </li>
                ))}
                <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-t border-border/60 bg-muted/30 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold">Total</p>
                    <p className="text-xs text-muted-foreground">
                      {report.bookingCount} booking
                      {report.bookingCount === 1 ? "" : "s"} · sales{" "}
                      {formatPriceFromCents(report.grandTotalCents, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatPriceFromCents(
                        report.staffPayoutTotalCents,
                        currency,
                      )}
                    </p>
                    <ReportCashCardSplit
                      cashCents={report.staffPayoutCashCents}
                      cardCents={report.staffPayoutCardCents}
                      currency={currency}
                    />
                  </div>
                </li>
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
          <p className="text-sm font-semibold">By day</p>
          <ul className="mt-3 divide-y divide-border/40">
            {report.dailyTotals.map((day) => (
              <li key={day.date} className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold">
                    {formatDayLabel(day.date, report.timezone)}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    You {formatPriceFromCents(day.staffPayoutCents, currency)}
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {day.bookingCount} booking{day.bookingCount === 1 ? "" : "s"} ·
                  sales {formatPriceFromCents(day.totalCents, currency)}
                </p>
                <ul className="mt-2 overflow-hidden rounded-xl border border-border/40">
                  <li className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] gap-2 bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span>Time</span>
                    <span>Service</span>
                    <span className="text-right">Your take</span>
                  </li>
                  {day.bookings.map((booking) => (
                    <li
                      key={booking.id}
                      className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-start gap-2 border-t border-border/40 px-3 py-2.5 text-sm"
                    >
                      <span className="pt-0.5 font-medium tabular-nums">
                        {formatAmPmTime(booking.startsAt)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {serviceLabel(booking.durationMinutes)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {booking.customerName?.trim() || "Guest"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <ReportBookingTypeBadge walkIn={Boolean(booking.walkIn)} />
                          <ReportPaymentIcons
                            cashCents={booking.cashCents}
                            cardCents={booking.cardCents}
                            currency={currency}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums">
                          {formatPriceFromCents(
                            booking.staffPayoutCents,
                            currency,
                          )}
                        </p>
                        <ReportCashCardSplit
                          cashCents={booking.staffPayoutCashCents}
                          cardCents={booking.staffPayoutCardCents}
                          currency={currency}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
        </>
      )}
    </div>
  );
}
