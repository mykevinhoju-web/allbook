"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  formatScheduleDate,
} from "@/features/booking/lib/schedule-utils";
import { formatPriceFromCents } from "@/features/services";
import { useOptionalTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

import type { CustomerSummary } from "../lib/customers-report";
import { fetchAdminApi } from "../lib/admin-api-client";

type CustomersResponse = {
  currency: string;
  customers: CustomerSummary[];
  total: number;
  error?: string;
};

export function AdminCustomersContent() {
  const tenant = useOptionalTenant();
  const currency = tenant?.settings.currency ?? "AUD";
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");

  const loadCustomers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);

      const response = await fetchAdminApi(
        `/api/admin/customers${params.size ? `?${params}` : ""}`,
      );
      const data = (await response.json()) as CustomersResponse;

      if (!response.ok) {
        setCustomers([]);
        return;
      }

      setCustomers(data.customers ?? []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers(search);
  }, [loadCustomers, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Customers"
        description="Guests from booking history — grouped by phone, email, or name."
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search name, phone, email…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4 text-muted-foreground" />
            {loading ? "Loading…" : `${customers.length} customer${customers.length === 1 ? "" : "s"}`}
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
              : "No customer bookings yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Bookings</th>
                  <th className="px-4 py-3 font-medium">Total spent</th>
                  <th className="px-4 py-3 font-medium">Last visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {customers.map((customer) => (
                  <tr key={customer.key} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">
                      {customer.name ?? "Walk-in"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="space-y-0.5">
                        {customer.phone ? <p>{customer.phone}</p> : null}
                        {customer.email ? <p>{customer.email}</p> : null}
                        {!customer.phone && !customer.email ? (
                          <p className="text-xs">—</p>
                        ) : null}
                      </div>
                    </td>
                    <td className={cn("px-4 py-3 tabular-nums")}>
                      {customer.bookingCount}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatPriceFromCents(customer.totalSpentCents, currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatScheduleDate(customer.lastBookingAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
