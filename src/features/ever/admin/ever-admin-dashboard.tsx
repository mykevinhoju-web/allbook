"use client";

import Link from "next/link";
import { CalendarDays, Loader2, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { appButtonVariants, toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { cn } from "@/lib/utils";

import type { EverSiteBooking } from "../types";

export function EverAdminDashboardContent() {
  const [pendingCount, setPendingCount] = useState(0);
  const [recent, setRecent] = useState<EverSiteBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminApi("/api/admin/ever/bookings");
      const data = (await response.json()) as {
        bookings?: EverSiteBooking[];
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) return;
        toast.error("Could not load dashboard", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      const bookings = data.bookings ?? [];
      setPendingCount(
        bookings.filter((booking) => booking.status === "pending").length,
      );
      setRecent(bookings.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Dashboard"
        description="Everwell Massage — website bookings"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-sm text-muted-foreground">Pending requests</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {pendingCount}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <p className="text-sm text-muted-foreground">Quick links</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/admin/bookings"
                  className={cn(appButtonVariants({ variant: "outline" }), "justify-start")}
                >
                  <CalendarDays className="size-4" />
                  View all bookings
                </Link>
                <Link
                  href="/admin/services"
                  className={cn(appButtonVariants({ variant: "outline" }), "justify-start")}
                >
                  <Wrench className="size-4" />
                  Manage services
                </Link>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-medium">Recent requests</h2>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
                {recent.map((booking) => (
                  <li
                    key={booking.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.serviceName}
                      </p>
                    </div>
                    <span className="text-xs capitalize text-muted-foreground">
                      {booking.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
