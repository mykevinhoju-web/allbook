"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import type { EverBookingStatus, EverSiteBooking } from "../types";

const STATUS_LABEL: Record<EverBookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export function EverAdminBookingsContent() {
  const [bookings, setBookings] = useState<EverSiteBooking[]>([]);
  const [timezone, setTimezone] = useState("Australia/Brisbane");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchAdminApi("/api/admin/ever/bookings");
      const data = (await response.json()) as {
        bookings?: EverSiteBooking[];
        timezone?: string;
        error?: string;
      };

      if (!response.ok) {
        if (response.status === 401) return;
        toast.error("Could not load bookings", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      setBookings(data.bookings ?? []);
      setTimezone(data.timezone ?? "Australia/Brisbane");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: EverBookingStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetchAdminApi("/api/admin/ever/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error("Could not update booking", {
          description: data.error ?? "Try again.",
        });
        return;
      }

      toast.success(`Marked as ${STATUS_LABEL[status].toLowerCase()}`);
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  const formatWhen = (iso: string) =>
    new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <AdminPageHeader
        title="Bookings"
        description="Website booking requests from everwellmassage.com.au"
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading bookings…
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3 align-top whitespace-nowrap">
                    {formatWhen(booking.startsAt)}
                  </td>
                  <td className="px-4 py-3 align-top">{booking.serviceName}</td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{booking.customerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {booking.customerPostcode}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-xs">
                    <div>{booking.customerPhone}</div>
                    <div className="text-muted-foreground">
                      {booking.customerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      {booking.status !== "confirmed" && (
                        <AppButton
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={updatingId === booking.id}
                          onClick={() =>
                            void updateStatus(booking.id, "confirmed")
                          }
                        >
                          Confirm
                        </AppButton>
                      )}
                      {booking.status !== "cancelled" && (
                        <AppButton
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={updatingId === booking.id}
                          onClick={() =>
                            void updateStatus(booking.id, "cancelled")
                          }
                        >
                          Cancel
                        </AppButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: EverBookingStatus }) {
  const styles: Record<EverBookingStatus, string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    confirmed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
