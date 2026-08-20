"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2, Minus, Plus, Search, Users } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  formatAmPmTime,
  formatDurationLabel,
  formatScheduleDate,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import { formatPriceFromCents } from "@/features/services";
import { useOptionalTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

import type {
  CustomerSummary,
  CustomersView,
} from "../lib/customers-report";
import { fetchAdminApi } from "../lib/admin-api-client";

type CustomersResponse = {
  currency: string;
  timezone: string;
  view: CustomersView;
  date: string | null;
  month: string | null;
  customers: CustomerSummary[];
  total: number;
  error?: string;
};

const VIEW_TABS: { id: CustomersView; label: string }[] = [
  { id: "all", label: "All customers" },
  { id: "daily", label: "Daily" },
  { id: "monthly", label: "Monthly" },
];

function monthInputValue(date: string): string {
  return date.slice(0, 7);
}

function CustomerVisits({
  customer,
  currency,
}: {
  customer: CustomerSummary;
  currency: string;
}) {
  if (customer.visits.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-muted-foreground">No visits</p>
    );
  }

  return (
    <ul className="divide-y divide-border/30">
      {customer.visits.map((visit) => (
        <li
          key={visit.bookingId}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              {formatScheduleDate(visit.startsAt)} ·{" "}
              {formatAmPmTime(visit.startsAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {[
                visit.staffName,
                visit.durationMinutes
                  ? formatDurationLabel(visit.durationMinutes)
                  : null,
                visit.status,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <p className="shrink-0 font-medium tabular-nums">
            {formatPriceFromCents(visit.priceCents, currency)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function AdminCustomersContent() {
  const tenant = useOptionalTenant();
  const timeZone = tenant?.settings.timezone ?? "Australia/Sydney";
  const currency = tenant?.settings.currency ?? "AUD";
  const today = useMemo(() => todayDateInZone(timeZone), [timeZone]);

  const [view, setView] = useState<CustomersView>("all");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(monthInputValue(today));
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const saveFlag = async (
    customer: CustomerSummary,
    next: { rating: CustomerSummary["rating"]; note: string },
  ) => {
    if (savingKey) return;
    setSavingKey(customer.key);
    try {
      const response = await fetchAdminApi("/api/admin/customers/flag", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerKey: customer.key,
          rating: next.rating,
          note: next.note,
        }),
      });
      const data = (await response.json()) as {
        rating?: CustomerSummary["rating"];
        note?: string;
        error?: string;
      };
      if (!response.ok) {
        toast.error("Could not save customer note", {
          description: data.error ?? "Try again.",
        });
        return;
      }
      const rating = data.rating ?? null;
      const note = data.note ?? "";
      setCustomers((current) =>
        current.map((row) =>
          row.key === customer.key ? { ...row, rating, note } : row,
        ),
      );
      setNoteDrafts((current) => ({ ...current, [customer.key]: note }));
    } catch {
      toast.error("Could not save customer note");
    } finally {
      setSavingKey(null);
    }
  };

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("view", view);
      if (search) params.set("q", search);
      if (view === "daily") params.set("date", date);
      if (view === "monthly") params.set("month", month);

      const response = await fetchAdminApi(
        `/api/admin/customers?${params.toString()}`,
      );
      const data = (await response.json()) as CustomersResponse;

      if (!response.ok) {
        setCustomers([]);
        return;
      }

      setCustomers(data.customers ?? []);
      setNoteDrafts(
        Object.fromEntries(
          (data.customers ?? []).map((row) => [row.key, row.note ?? ""]),
        ),
      );
      setOpenKey(null);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [view, search, date, month]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const periodLabel =
    view === "daily"
      ? date
      : view === "monthly"
        ? month
        : "all time";

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Customers"
        description="Guest history from bookings. Mark + good (blue) or − bad (red), and leave a short note."
      />

      <div className="flex flex-wrap gap-2">
        {VIEW_TABS.map((tab) => {
          const selected = view === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-sm font-semibold transition",
                selected
                  ? "border-[#8A6A3A] bg-[#8A6A3A]/10 text-stone-900 ring-2 ring-[#8A6A3A]/20"
                  : "border-border/60 bg-card text-muted-foreground hover:bg-muted/40",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative min-w-[16rem] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search name, phone, email…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {view === "daily" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Day
            </span>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-[11.5rem]"
            />
          </label>
        ) : null}

        {view === "monthly" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Month
            </span>
            <Input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-[11.5rem]"
            />
          </label>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4 text-muted-foreground" />
            {loading
              ? "Loading…"
              : `${customers.length} customer${customers.length === 1 ? "" : "s"} · ${periodLabel}`}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading customers…
          </div>
        ) : customers.length === 0 ? (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">
            {search
              ? "No customers match your search."
              : view === "daily"
                ? "No customers on this day."
                : view === "monthly"
                  ? "No customers in this month."
                  : "No customer bookings yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">
                    {view === "all" ? "Visits" : "Period visits"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {view === "all" ? "Total spent" : "Period spent"}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {view === "all" ? "Last visit" : "Visit date"}
                  </th>
                  <th className="px-4 py-3 font-medium">History</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const open = openKey === customer.key;
                  const spent =
                    view === "all"
                      ? customer.totalSpentCents
                      : customer.periodSpentCents;
                  const visitCount =
                    view === "all"
                      ? customer.bookingCount
                      : customer.periodVisitCount;

                  return (
                    <Fragment key={customer.key}>
                      <tr className="border-b border-border/40 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p
                            className={cn(
                              "font-medium",
                              customer.rating === "good" &&
                                "text-blue-600 dark:text-blue-400",
                              customer.rating === "bad" &&
                                "text-red-600 dark:text-red-400",
                            )}
                          >
                            {customer.name ?? "Walk-in"}
                            {customer.rating === "good" ? (
                              <span className="ml-1.5 text-xs font-semibold">
                                + good
                              </span>
                            ) : null}
                            {customer.rating === "bad" ? (
                              <span className="ml-1.5 text-xs font-semibold">
                                − bad
                              </span>
                            ) : null}
                          </p>
                          {view !== "all" ? (
                            <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                              {customer.bookingCount} visit
                              {customer.bookingCount === 1 ? "" : "s"} total
                            </p>
                          ) : null}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <AppButton
                              type="button"
                              variant="outline"
                              size="icon"
                              className={cn(
                                "size-8 rounded-lg",
                                customer.rating === "good" &&
                                  "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                              )}
                              disabled={savingKey === customer.key}
                              aria-label="Mark as good customer"
                              onClick={() =>
                                void saveFlag(customer, {
                                  rating:
                                    customer.rating === "good" ? null : "good",
                                  note:
                                    noteDrafts[customer.key] ??
                                    customer.note ??
                                    "",
                                })
                              }
                            >
                              <Plus className="size-4" />
                            </AppButton>
                            <AppButton
                              type="button"
                              variant="outline"
                              size="icon"
                              className={cn(
                                "size-8 rounded-lg",
                                customer.rating === "bad" &&
                                  "border-red-400 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
                              )}
                              disabled={savingKey === customer.key}
                              aria-label="Mark as bad customer"
                              onClick={() =>
                                void saveFlag(customer, {
                                  rating:
                                    customer.rating === "bad" ? null : "bad",
                                  note:
                                    noteDrafts[customer.key] ??
                                    customer.note ??
                                    "",
                                })
                              }
                            >
                              <Minus className="size-4" />
                            </AppButton>
                            <Input
                              value={
                                noteDrafts[customer.key] ?? customer.note ?? ""
                              }
                              maxLength={160}
                              placeholder="Short note"
                              disabled={savingKey === customer.key}
                              onChange={(event) => {
                                const value = event.target.value;
                                setNoteDrafts((current) => ({
                                  ...current,
                                  [customer.key]: value,
                                }));
                              }}
                              onBlur={(event) => {
                                const nextNote = event.target.value.trim();
                                if (nextNote === (customer.note ?? "").trim()) {
                                  return;
                                }
                                void saveFlag(customer, {
                                  rating: customer.rating,
                                  note: nextNote,
                                });
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.currentTarget.blur();
                                }
                              }}
                              className="h-8 min-w-[10rem] max-w-[16rem] flex-1 rounded-lg text-xs"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <div className="space-y-0.5">
                            {customer.phone ? <p>{customer.phone}</p> : null}
                            {customer.email ? <p>{customer.email}</p> : null}
                            {customer.postcode ? (
                              <p className="text-xs">{customer.postcode}</p>
                            ) : null}
                            {!customer.phone &&
                            !customer.email &&
                            !customer.postcode ? (
                              <p className="text-xs">—</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {visitCount}
                        </td>
                        <td className="px-4 py-3 font-medium tabular-nums">
                          {formatPriceFromCents(spent, currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatScheduleDate(customer.lastBookingAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenKey(open ? null : customer.key)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40"
                          >
                            {open ? "Hide" : "Show"} dates
                            <ChevronDown
                              className={cn(
                                "size-3.5 transition",
                                open && "rotate-180",
                              )}
                            />
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr className="border-b border-border/40 bg-muted/15">
                          <td colSpan={6} className="p-0">
                            <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Service history
                            </p>
                            <CustomerVisits
                              customer={customer}
                              currency={currency}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
