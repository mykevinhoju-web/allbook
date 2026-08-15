"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppButton, toast } from "@/components/common";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import {
  playServiceEndAlarm,
  vibrateForBooking,
} from "@/features/booking/lib/booking-alert-sound";
import {
  broadcastExtendResolved,
  broadcastStartResolved,
  subscribeToBookingAlerts,
} from "@/features/booking/lib/booking-realtime";
import {
  formatAmPmTime,
  formatDurationLabel,
} from "@/features/booking/lib/schedule-utils";
import type { BookingExtendRequest } from "@/features/booking/types/extend-request";
import type { RoomStartRequest } from "@/features/booking/types/room-start-request";
import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";
import {
  applyPricingAdjustments,
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import { formatPriceFromCents } from "@/features/services";
import { useTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

type QueueItem =
  | { kind: "extend"; id: string; createdAt: string; extend: BookingExtendRequest }
  | { kind: "start"; id: string; createdAt: string; start: RoomStartRequest };

/**
 * Sticky admin popup for room-tablet extend and Book-start requests.
 */
export function AdminExtendRequestWatcher() {
  const tenant = useTenant();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<
    InternalPaymentMethod | ""
  >("");
  const [submitting, setSubmitting] = useState(false);
  const [servicePrices, setServicePrices] = useState<
    Record<number, number>
  >({});
  const [pricingAdjustments, setPricingAdjustments] =
    useState<PricingAdjustments>(DEFAULT_PRICING_ADJUSTMENTS);
  const [currency, setCurrency] = useState(
    () => tenant.settings.currency || "AUD",
  );
  const knownIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  const active = queue[0] ?? null;

  const alertNewRequests = useCallback((items: QueueItem[]) => {
    const known = knownIdsRef.current;
    const fresh = items.filter((row) => !known.has(row.id));
    for (const row of items) known.add(row.id);
    for (const id of [...known]) {
      if (!items.some((row) => row.id === id)) known.delete(id);
    }
    if (!primedRef.current) {
      primedRef.current = true;
      return;
    }
    if (fresh.length === 0) return;

    const lead = fresh[0]!;
    void playServiceEndAlarm(2);
    vibrateForBooking();
    if (lead.kind === "start") {
      toast.error("Start request", {
        description: `${lead.start.roomName ?? "Room"} · ${lead.start.staffName} · ${formatDurationLabel(lead.start.durationMinutes)}`,
        duration: 12_000,
      });
      return;
    }
    toast.error("Extend request", {
      description: `${lead.extend.roomName ?? "Room"} · ${lead.extend.staffName} · +${formatDurationLabel(lead.extend.minutes)}`,
      duration: 12_000,
    });
  }, []);

  const loadPending = useCallback(async () => {
    const [extendRes, startRes] = await Promise.all([
      fetchAdminApi("/api/admin/extend-requests"),
      fetchAdminApi("/api/admin/start-requests"),
    ]);
    const extendData = extendRes.ok
      ? ((await extendRes.json()) as { requests?: BookingExtendRequest[] })
      : { requests: [] };
    const startData = startRes.ok
      ? ((await startRes.json()) as { requests?: RoomStartRequest[] })
      : { requests: [] };

    const next: QueueItem[] = [
      ...(extendData.requests ?? []).map((row) => ({
        kind: "extend" as const,
        id: `extend:${row.id}`,
        createdAt: row.createdAt,
        extend: row,
      })),
      ...(startData.requests ?? []).map((row) => ({
        kind: "start" as const,
        id: `start:${row.id}`,
        createdAt: row.createdAt,
        start: row,
      })),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    alertNewRequests(next);
    setQueue(next);
  }, [alertNewRequests]);

  useEffect(() => {
    void loadPending();
    const timer = window.setInterval(() => void loadPending(), 20_000);
    return () => window.clearInterval(timer);
  }, [loadPending]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/service-options");
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as {
        options?: { durationMinutes: number; priceCents: number }[];
        currency?: string;
        pricingAdjustments?: PricingAdjustments;
      };
      const map: Record<number, number> = {};
      for (const option of data.options ?? []) {
        map[option.durationMinutes] = option.priceCents;
      }
      setServicePrices(map);
      if (data.currency) setCurrency(data.currency);
      if (data.pricingAdjustments) {
        setPricingAdjustments(data.pricingAdjustments);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeToBookingAlerts(
      tenant.slug,
      () => {},
      undefined,
      undefined,
      () => {
        void loadPending();
      },
      () => {
        void loadPending();
      },
      () => {
        void loadPending();
      },
      () => {
        void loadPending();
      },
    );
  }, [tenant.slug, loadPending]);

  useEffect(() => {
    if (active?.kind === "start" && active.start.requestedPayment) {
      setPaymentMethod(active.start.requestedPayment);
      return;
    }
    setPaymentMethod("");
  }, [active?.id, active?.kind, active]);

  const priceBreakdown = useMemo(() => {
    if (!active) return null;
    const minutes =
      active.kind === "start"
        ? active.start.durationMinutes
        : active.extend.minutes;
    const baseCents = servicePrices[minutes];
    if (baseCents == null) return null;
    return applyPricingAdjustments({
      baseCents,
      startsAtIso: new Date().toISOString(),
      timeZone: tenant.settings.timezone || "Australia/Sydney",
      channel: "internal",
      adjustments: pricingAdjustments,
      paymentMethod:
        paymentMethod === "cash" || paymentMethod === "card"
          ? paymentMethod
          : null,
    });
  }, [
    active,
    servicePrices,
    paymentMethod,
    pricingAdjustments,
    tenant.settings.timezone,
  ]);

  const approve = async () => {
    if (!active) return;
    if (paymentMethod !== "cash" && paymentMethod !== "card") {
      toast.error("Select cash or card");
      return;
    }
    setSubmitting(true);
    try {
      if (active.kind === "start") {
        const response = await fetchAdminApi(
          `/api/admin/start-requests/${active.start.id}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentMethod }),
          },
        );
        const data = (await response.json()) as {
          error?: string;
          resolvedAt?: string;
        };
        if (!response.ok) {
          toast.error("Could not approve start", { description: data.error });
          return;
        }
        toast.success("Service started");
        void broadcastStartResolved(tenant.slug, {
          bookingId: active.start.id,
          status: "approved",
          resolvedAt: data.resolvedAt ?? new Date().toISOString(),
        }).catch(() => {});
        knownIdsRef.current.delete(active.id);
        setQueue((prev) => prev.filter((row) => row.id !== active.id));
        return;
      }

      const response = await fetchAdminApi(
        `/api/admin/extend-requests/${active.extend.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        booking?: { endsAt?: string };
        resolvedAt?: string;
      };
      if (!response.ok) {
        toast.error("Could not approve extend", { description: data.error });
        return;
      }
      toast.success(`Extended +${formatDurationLabel(active.extend.minutes)}`);
      void broadcastExtendResolved(tenant.slug, {
        requestId: active.extend.id,
        bookingId: active.extend.bookingId,
        status: "approved",
        minutes: active.extend.minutes,
        newEndsAt: data.booking?.endsAt,
        resolvedAt: data.resolvedAt ?? new Date().toISOString(),
      }).catch(() => {});
      knownIdsRef.current.delete(active.id);
      setQueue((prev) => prev.filter((row) => row.id !== active.id));
    } finally {
      setSubmitting(false);
    }
  };

  const decline = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      if (active.kind === "start") {
        const response = await fetchAdminApi(
          `/api/admin/start-requests/${active.start.id}/reject`,
          { method: "POST" },
        );
        const data = (await response.json()) as {
          error?: string;
          resolvedAt?: string;
        };
        if (!response.ok) {
          toast.error("Could not decline", { description: data.error });
          return;
        }
        void broadcastStartResolved(tenant.slug, {
          bookingId: active.start.id,
          status: "rejected",
          resolvedAt: data.resolvedAt ?? new Date().toISOString(),
        }).catch(() => {});
        knownIdsRef.current.delete(active.id);
        setQueue((prev) => prev.filter((row) => row.id !== active.id));
        toast.message("Start request declined");
        return;
      }

      const response = await fetchAdminApi(
        `/api/admin/extend-requests/${active.extend.id}/reject`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        error?: string;
        resolvedAt?: string;
      };
      if (!response.ok) {
        toast.error("Could not decline", { description: data.error });
        return;
      }
      void broadcastExtendResolved(tenant.slug, {
        requestId: active.extend.id,
        bookingId: active.extend.bookingId,
        status: "rejected",
        minutes: active.extend.minutes,
        resolvedAt: data.resolvedAt ?? new Date().toISOString(),
      }).catch(() => {});
      knownIdsRef.current.delete(active.id);
      setQueue((prev) => prev.filter((row) => row.id !== active.id));
      toast.message("Extend request declined");
    } finally {
      setSubmitting(false);
    }
  };

  const start = active?.kind === "start" ? active.start : null;
  const extend = active?.kind === "extend" ? active.extend : null;

  return (
    <Dialog
      open={Boolean(active)}
      onOpenChange={() => {
        // Sticky until Approve / Decline — ignore outside dismiss.
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-0 overflow-hidden p-0 sm:rounded-3xl"
      >
        {start ? (
          <>
            <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
              <DialogTitle className="text-xl">Start service</DialogTitle>
              <DialogDescription>
                Room Book start · waiting for your approval
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Walk-in now
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {start.customerName || "Walk-in"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {start.staffName}
                  {start.roomName ? ` · ${start.roomName}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDurationLabel(start.durationMinutes)} · starts now
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Service
                </p>
                <div className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground ring-2 ring-primary/20">
                  {formatDurationLabel(start.durationMinutes)}
                </div>
              </div>

              {priceBreakdown ? (
                <div className="flex items-baseline justify-between rounded-xl bg-muted px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatPriceFromCents(priceBreakdown.totalCents, currency)}
                  </p>
                </div>
              ) : (
                <div className="flex items-baseline justify-between rounded-xl bg-muted px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatPriceFromCents(start.priceCents, currency)}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Payment method
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "cash" as const, label: "Cash" },
                      { value: "card" as const, label: "Card" },
                    ] as const
                  ).map((option) => {
                    const selected = paymentMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={cn(
                          "min-h-12 rounded-xl border text-sm font-semibold",
                          selected
                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                            : "border-border bg-background text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border bg-stone-100 px-6 py-4">
              <AppButton
                type="button"
                variant="outline"
                className="h-12 rounded-2xl"
                disabled={submitting}
                onClick={() => void decline()}
              >
                Decline
              </AppButton>
              <AppButton
                type="button"
                className="h-12 rounded-2xl"
                disabled={submitting || !paymentMethod}
                onClick={() => void approve()}
              >
                {submitting ? "Saving…" : "Approve start"}
              </AppButton>
            </div>
          </>
        ) : extend ? (
          <>
            <DialogHeader className="space-y-1 border-b border-border px-6 py-5 text-left">
              <DialogTitle className="text-xl">Extend service</DialogTitle>
              <DialogDescription>
                Room request · waiting for cash/card approval
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-2xl bg-muted px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  In room now
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {extend.customerName || "Guest"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {extend.staffName}
                  {extend.roomName ? ` · ${extend.roomName}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Now ends {formatAmPmTime(extend.bookingEndsAt)} · extend +
                  {formatDurationLabel(extend.minutes)}
                </p>
                {extend.customerPhone ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {extend.customerPhone}
                    {extend.customerPostcode
                      ? ` · ${extend.customerPostcode}`
                      : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Service
                </p>
                <div className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground ring-2 ring-primary/20">
                  +{formatDurationLabel(extend.minutes)} extend
                </div>
              </div>

              {priceBreakdown ? (
                <div className="flex items-baseline justify-between rounded-xl bg-muted px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total
                  </p>
                  <div className="text-right">
                    <p className="text-xl font-semibold text-foreground">
                      {formatPriceFromCents(priceBreakdown.totalCents, currency)}
                    </p>
                    {priceBreakdown.discountCents > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        – cash discount{" "}
                        {formatPriceFromCents(
                          priceBreakdown.discountCents,
                          currency,
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Payment method
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "cash" as const, label: "Cash" },
                      { value: "card" as const, label: "Card" },
                    ] as const
                  ).map((option) => {
                    const selected = paymentMethod === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPaymentMethod(option.value)}
                        className={cn(
                          "min-h-12 rounded-xl border text-sm font-semibold",
                          selected
                            ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                            : "border-border bg-background text-foreground",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border bg-stone-100 px-6 py-4">
              <AppButton
                type="button"
                variant="outline"
                className="h-12 rounded-2xl"
                disabled={submitting}
                onClick={() => void decline()}
              >
                Decline
              </AppButton>
              <AppButton
                type="button"
                className="h-12 rounded-2xl"
                disabled={submitting || !paymentMethod}
                onClick={() => void approve()}
              >
                {submitting ? "Saving…" : "Approve extend"}
              </AppButton>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
