"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, ChevronDown, Loader2, Lock, Users } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  addDaysToDateInput,
  formatAmPmTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { formatPriceFromCents } from "@/features/services";
import { useOptionalTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

import type {
  RevenueDailyTotal,
  RevenueStaffReport,
} from "../lib/revenue-report";
import { fetchAdminApi } from "../lib/admin-api-client";
import { ReportBookingTypeBadge } from "./report-booking-type-badge";
import { ReportPaymentIcons } from "./report-payment-icons";

type StaffOption = { id: string; name: string };

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
  shopCashCents: number;
  shopCardCents: number;
  cashTotalCents: number;
  cardTotalCents: number;
  bookingCount: number;
  byStaff: RevenueStaffReport[];
  dailyTotals: RevenueDailyTotal[];
  error?: string;
};

function monthStartDate(date: string): string {
  return `${date.slice(0, 7)}-01`;
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

function CashCardSplit({
  cashCents,
  cardCents,
  currency,
  loading,
}: {
  cashCents: number;
  cardCents: number;
  currency: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="shrink-0 text-right text-sm leading-6 text-muted-foreground">
        <p>Cash —</p>
        <p>Card —</p>
      </div>
    );
  }
  return (
    <div className="shrink-0 text-right text-sm leading-6 tabular-nums">
      <p>
        <span className="text-muted-foreground">Cash</span>{" "}
        <span className="font-semibold text-foreground">
          {formatPriceFromCents(cashCents, currency)}
        </span>
      </p>
      <p>
        <span className="text-muted-foreground">Card</span>{" "}
        <span className="font-semibold text-foreground">
          {formatPriceFromCents(cardCents, currency)}
        </span>
      </p>
    </div>
  );
}

function DailySummaryRows({
  daily,
  currency,
  timeZone,
  dense,
}: {
  daily: RevenueDailyTotal[];
  currency: string;
  timeZone: string;
  dense?: boolean;
}) {
  if (daily.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">No bookings</p>
    );
  }

  return (
    <ul className="divide-y divide-border/40">
      {daily.map((row) => (
        <li
          key={row.date}
          className={cn(
            "flex items-center justify-between gap-3",
            dense ? "py-2" : "py-2.5",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{formatDayLabel(row.date, timeZone)}</p>
            <p className="text-xs text-muted-foreground">
              {row.bookingCount} booking{row.bookingCount === 1 ? "" : "s"}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {formatPriceFromCents(row.totalCents, currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function StaffDailyDetail({
  daily,
  currency,
  timeZone,
}: {
  daily: RevenueDailyTotal[];
  currency: string;
  timeZone: string;
}) {
  if (daily.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">No bookings</p>
    );
  }

  return (
    <div className="space-y-4">
      {daily.map((day) => (
        <div key={day.date}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-0.5">
            <p className="text-sm font-semibold">{formatDayLabel(day.date, timeZone)}</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatPriceFromCents(day.totalCents, currency)}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/40">
            <div className="hidden bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem_minmax(7.5rem,9.5rem)_5rem_5rem] sm:gap-x-1 sm:gap-y-0">
              <span>Time</span>
              <span>Customer</span>
              <span>Type</span>
              <span className="text-right">Payment</span>
              <span className="text-right">Sales</span>
              <span className="text-right">Staff</span>
            </div>
            <ul className="divide-y divide-border/40">
              {day.bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="px-3 py-2.5 sm:grid sm:grid-cols-[5.5rem_minmax(0,1fr)_5.5rem_minmax(7.5rem,9.5rem)_5rem_5rem] sm:items-center sm:gap-x-1 sm:gap-y-0"
                >
                  <p className="text-sm font-medium tabular-nums">
                    {formatAmPmTime(booking.startsAt)}
                  </p>
                  <div className="min-w-0 sm:col-start-2">
                    <p className="truncate text-sm font-medium">
                      {booking.customerName?.trim() || "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {formatAmPmTime(booking.startsAt)}
                    </p>
                    <div className="mt-1 sm:hidden">
                      <ReportBookingTypeBadge walkIn={booking.walkIn} />
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <ReportBookingTypeBadge walkIn={booking.walkIn} />
                  </div>
                  <div className="mt-1.5 flex justify-start sm:mt-0 sm:justify-end">
                    <ReportPaymentIcons
                      cashCents={booking.cashCents}
                      cardCents={booking.cardCents}
                      currency={currency}
                    />
                  </div>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums sm:mt-0 sm:text-right">
                    {formatPriceFromCents(booking.priceCents, currency)}
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground sm:text-right">
                    {formatPriceFromCents(booking.staffPayoutCents, currency)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

function StaffSection({
  staff,
  currency,
  timeZone,
  defaultOpen,
}: {
  staff: RevenueStaffReport;
  currency: string;
  timeZone: string;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-border/50 bg-card shadow-soft open:shadow-md"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight">
              {staff.staffName}
            </p>
            <p className="text-xs text-muted-foreground">
              {staff.bookingCount} booking{staff.bookingCount === 1 ? "" : "s"} ·{" "}
              staff {formatPriceFromCents(staff.staffPayoutCents, currency)} ·
              shop {formatPriceFromCents(staff.shopCents, currency)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-base font-semibold tabular-nums sm:text-lg">
            {formatPriceFromCents(staff.totalCents, currency)}
          </p>
          <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
        </div>
      </summary>
      <div className="border-t border-border/40 px-4 pb-4 pt-3 sm:px-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bookings
        </p>
        <StaffDailyDetail
          daily={staff.daily}
          currency={currency}
          timeZone={timeZone}
        />
      </div>
    </details>
  );
}

export function AdminReportsContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone || "Australia/Sydney";
  const tenantCurrency = tenant?.settings.currency || "AUD";

  const today = useMemo(() => todayDateInZone(timeZone), [timeZone]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [staffId, setStaffId] = useState("");
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [report, setReport] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    setFrom(today);
    setTo(today);
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/admin/reports/unlock");
        const data = (await response.json()) as { unlocked?: boolean };
        if (!cancelled) setUnlocked(Boolean(response.ok && data.unlocked));
      } catch {
        if (!cancelled) setUnlocked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    void (async () => {
      try {
        const response = await fetchAdminApi("/api/admin/staff");
        const data = (await response.json()) as {
          staff?: { id: string; name: string }[];
        };
        if (!response.ok) return;
        setStaffOptions(
          (data.staff ?? []).map((member) => ({
            id: member.id,
            name: member.name,
          })),
        );
      } catch {
        // Staff filter optional if list fails.
      }
    })();
  }, [unlocked]);

  const loadReport = useCallback(async () => {
    if (!unlocked) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      if (staffId) params.set("staffId", staffId);

      const response = await fetch(
        `/api/admin/reports/revenue?${params.toString()}`,
      );
      const data = (await response.json()) as RevenueResponse & {
        code?: string;
      };

      if (response.status === 403 && data.code === "REPORTS_LOCKED") {
        setUnlocked(false);
        setReport(null);
        return;
      }

      if (!response.ok) {
        if (response.status === 401) return;
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
  }, [from, to, staffId, unlocked]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const unlockReports = async () => {
    if (!password || unlocking) return;
    setUnlocking(true);
    try {
      const response = await fetch("/api/admin/reports/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error("Could not unlock reports", {
          description: data.error ?? "Check the admin password.",
        });
        return;
      }
      setPassword("");
      setUnlocked(true);
    } catch {
      toast.error("Could not unlock reports", {
        description: "Network error. Try again.",
      });
    } finally {
      setUnlocking(false);
    }
  };

  const currency = report?.currency ?? tenantCurrency;
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

  if (unlocked !== true) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-3 py-10 sm:px-4">
        <AdminPageHeader
          title="Reports"
          description="Enter the admin password to view cash and card revenue."
        />
        <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-soft">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
            <Lock className="size-5 text-foreground" />
          </div>
          {unlocked === null ? (
            <p className="text-sm text-muted-foreground">Checking access…</p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void unlockReports();
              }}
            >
              <label className="block space-y-2 text-sm">
                <span>Admin password</span>
                <Input
                  type="password"
                  value={password}
                  autoFocus
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 rounded-xl"
                  autoComplete="current-password"
                />
              </label>
              <AppButton
                type="submit"
                className="h-11 w-full rounded-xl text-base"
                disabled={unlocking || !password}
              >
                {unlocking ? "Unlocking…" : "Unlock reports"}
              </AppButton>
            </form>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-4 lg:p-6">
      <AdminPageHeader
        title="Reports"
        description="Booking revenue by staff and day for the dates you select."
      />

      <section className="rounded-2xl border border-border/50 bg-card p-3 shadow-soft sm:p-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["today", "Today"],
              ["7d", "Last 7 days"],
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

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
          <label className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              From
            </span>
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
          <label className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-muted-foreground">
              Staff
            </span>
            <select
              className="h-11 w-full appearance-none rounded-xl border border-border/60 bg-background px-3 text-sm font-medium outline-none"
              value={staffId}
              onChange={(event) => setStaffId(event.target.value)}
            >
              <option value="">All staff</option>
              {staffOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <AppButton
              type="button"
              className="h-11 w-full rounded-xl lg:w-auto lg:min-w-28"
              onClick={() => void loadReport()}
              disabled={loading}
            >
              {loading ? "Loading…" : "Apply"}
            </AppButton>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Total sales</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                {loading && !report
                  ? "—"
                  : formatPriceFromCents(
                      report?.grandTotalCents ?? 0,
                      currency,
                    )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {from === to ? from : `${from} → ${to}`}
                {staffId
                  ? ` · ${staffOptions.find((s) => s.id === staffId)?.name ?? "Staff"}`
                  : " · All staff"}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="size-4" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Staff take</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-3xl font-semibold tabular-nums">
              {loading && !report
                ? "—"
                : formatPriceFromCents(
                    report?.staffPayoutTotalCents ?? 0,
                    currency,
                  )}
            </p>
            <CashCardSplit
              cashCents={report?.staffPayoutCashCents ?? 0}
              cardCents={report?.staffPayoutCardCents ?? 0}
              currency={currency}
              loading={Boolean(loading && !report)}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Amount staff keep from services
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Shop profit</p>
          <div className="mt-1 flex items-start justify-between gap-3">
            <p className="text-3xl font-semibold tabular-nums">
              {loading && !report
                ? "—"
                : formatPriceFromCents(report?.shopTotalCents ?? 0, currency)}
            </p>
            <CashCardSplit
              cashCents={report?.shopCashCents ?? 0}
              cardCents={report?.shopCardCents ?? 0}
              currency={currency}
              loading={Boolean(loading && !report)}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sales minus staff take
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Cash</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {loading && !report
              ? "—"
              : formatPriceFromCents(report?.cashTotalCents ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Walk-in cash + split cash
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">Card / online</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {loading && !report
              ? "—"
              : formatPriceFromCents(report?.cardTotalCents ?? 0, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Card, split card, online
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft">
        <p className="text-sm text-muted-foreground">Bookings</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">
          {loading && !report ? "—" : (report?.bookingCount ?? 0)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Paid / recorded · excludes unpaid Pre bookings
        </p>
      </section>

      {loading && !report ? (
        <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : !report || report.byStaff.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 px-6 py-16">
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            No booking revenue in this date range. Try another period or staff
            filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold tracking-tight">By staff</h2>
              <p className="text-xs text-muted-foreground">
                Tap for booking details
              </p>
            </div>
            <div className="space-y-3">
              {report.byStaff.map((staff, index) => (
                <StaffSection
                  key={staff.staffId}
                  staff={staff}
                  currency={currency}
                  timeZone={report.timezone}
                  defaultOpen={index === 0 && report.byStaff.length <= 4}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft lg:sticky lg:top-4">
            <h2 className="text-sm font-semibold tracking-tight">Daily total</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              All selected staff combined
            </p>
            <div className="mt-2">
              <DailySummaryRows
                daily={report.dailyTotals}
                currency={currency}
                timeZone={report.timezone}
                dense
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
