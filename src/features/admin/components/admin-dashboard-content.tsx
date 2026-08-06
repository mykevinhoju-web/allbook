"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  DollarSign,
  Loader2,
  Users,
} from "lucide-react";

import { appButtonVariants, toast } from "@/components/common";
import { cn } from "@/lib/utils";
import { formatPriceFromCents } from "@/features/services";
import { useOptionalTenant } from "@/features/tenants";

import { AdminPageHeader } from "./admin-page-header";
import { AdminStatCard } from "./admin-stat-card";
import { fetchAdminApi } from "../lib/admin-api-client";

type DashboardStatsResponse = {
  currency: string;
  timezone: string;
  today: string;
  yesterday: string;
  todayBookingCount: number;
  yesterdayBookingCount: number;
  yesterdayRevenueCents: number;
  staffWorkingToday: { id: string; name: string; shiftLabel: string | null }[];
  bookingsByStaff: {
    staffId: string;
    staffName: string;
    bookingCount: number;
  }[];
  error?: string;
};

function formatStaffNames(names: string[]): string {
  if (names.length === 0) return "No one scheduled";
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

export function AdminDashboardContent() {
  const tenant = useOptionalTenant();
  const currency = tenant?.settings.currency || "AUD";
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminApi("/api/admin/dashboard/stats");
      const data = (await response.json()) as DashboardStatsResponse;

      if (!response.ok) {
        if (response.status === 401) return;
        toast.error("Could not load dashboard", {
          description: data.error ?? "Try again.",
        });
        setStats(null);
        return;
      }

      setStats(data);
    } catch {
      toast.error("Could not load dashboard", {
        description: "Network error. Try again.",
      });
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const workingNames = stats?.staffWorkingToday.map((member) => member.name) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-4 sm:px-4 lg:gap-6 lg:p-6">
      <AdminPageHeader
        title="Dashboard"
        description="Today's bookings and staff at a glance."
        action={
          <Link
            href="/admin/bookings"
            className={cn(
              appButtonVariants({ variant: "primary" }),
              "h-11 w-full rounded-xl sm:w-auto",
            )}
          >
            <CalendarPlus className="size-4" />
            New booking
          </Link>
        }
      />

      {loading && !stats ? (
        <div className="flex flex-1 items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            <AdminStatCard
              title="Today's bookings"
              value={String(stats?.todayBookingCount ?? 0)}
              description={
                stats?.today
                  ? `${stats.today} · non-cancelled`
                  : "Non-cancelled bookings"
              }
              icon={CalendarDays}
            />
            <AdminStatCard
              title="Staff working today"
              value={String(stats?.staffWorkingToday.length ?? 0)}
              description={formatStaffNames(workingNames)}
              icon={Users}
            />
            <AdminStatCard
              title="Yesterday's bookings"
              value={String(stats?.yesterdayBookingCount ?? 0)}
              description={
                stats?.yesterday ? `${stats.yesterday}` : "Previous day"
              }
              icon={CalendarDays}
            />
            <AdminStatCard
              title="Yesterday's revenue"
              value={formatPriceFromCents(
                stats?.yesterdayRevenueCents ?? 0,
                stats?.currency ?? currency,
              )}
              description="Service price total"
              icon={DollarSign}
            />
          </div>

          <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight">
                  Today&apos;s bookings by staff
                </h2>
                <p className="text-xs text-muted-foreground">
                  Count of non-cancelled bookings starting today
                </p>
              </div>
              <Link
                href="/admin/reports"
                className="text-xs font-medium text-primary hover:underline"
              >
                Full reports →
              </Link>
            </div>

            {!stats || stats.bookingsByStaff.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                No bookings scheduled for today yet.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-border/40">
                <div className="hidden bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_6rem] sm:gap-3">
                  <span>Staff</span>
                  <span className="text-right">Bookings</span>
                </div>
                <ul className="divide-y divide-border/40">
                  {stats.bookingsByStaff.map((row) => (
                    <li
                      key={row.staffId}
                      className="flex items-center justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem]"
                    >
                      <p className="truncate text-sm font-medium">
                        {row.staffName}
                      </p>
                      <p className="shrink-0 text-sm font-semibold tabular-nums sm:text-right">
                        {row.bookingCount}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {stats && stats.staffWorkingToday.length > 0 ? (
            <section className="rounded-2xl border border-border/50 bg-card p-4 shadow-soft sm:p-5">
              <h2 className="text-sm font-semibold tracking-tight">
                Working today
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Staff scheduled or available today
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-border/40">
                <div className="hidden bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-3">
                  <span>Staff</span>
                  <span className="text-right">Hours</span>
                </div>
                <ul className="divide-y divide-border/40">
                  {stats.staffWorkingToday.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_9rem]"
                    >
                      <Link
                        href={`/admin/staff/${member.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {member.name}
                      </Link>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground sm:text-right">
                        {member.shiftLabel ?? "—"}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
