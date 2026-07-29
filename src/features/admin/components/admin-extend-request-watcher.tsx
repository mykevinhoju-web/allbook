"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
  broadcastExtendResolved,
  subscribeToBookingAlerts,
} from "@/features/booking/lib/booking-realtime";
import {
  formatAmPmTime,
  formatDurationLabel,
} from "@/features/booking/lib/schedule-utils";
import type { BookingExtendRequest } from "@/features/booking/types/extend-request";
import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";
import {
  applyPricingAdjustments,
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import { formatPriceFromCents } from "@/features/services";
import { useTenant } from "@/features/tenants";
import { cn } from "@/lib/utils";

/**
 * Sticky admin popup for room-tablet extend requests.
 * Stays open until Approve (extend + pay) or Decline.
 */
export function AdminExtendRequestWatcher() {
  const tenant = useTenant();
  const [queue, setQueue] = useState<BookingExtendRequest[]>([]);
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

  const active = queue[0] ?? null;

  const loadPending = useCallback(async () => {
    const response = await fetchAdminApi("/api/admin/extend-requests");
    if (!response.ok) return;
    const data = (await response.json()) as {
      requests?: BookingExtendRequest[];
    };
    setQueue(data.requests ?? []);
  }, []);

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
        void playChime();
      },
      () => {
        void loadPending();
      },
    );
  }, [tenant.slug, loadPending]);

  useEffect(() => {
    setPaymentMethod("");
  }, [active?.id]);

  const priceBreakdown = useMemo(() => {
    if (!active) return null;
    const baseCents = servicePrices[active.minutes];
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
      const response = await fetchAdminApi(
        `/api/admin/extend-requests/${active.id}/approve`,
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
      toast.success(`Extended +${formatDurationLabel(active.minutes)}`);
      void broadcastExtendResolved(tenant.slug, {
        requestId: active.id,
        bookingId: active.bookingId,
        status: "approved",
        minutes: active.minutes,
        newEndsAt: data.booking?.endsAt,
        resolvedAt: data.resolvedAt ?? new Date().toISOString(),
      }).catch(() => {});
      setQueue((prev) => prev.filter((row) => row.id !== active.id));
    } finally {
      setSubmitting(false);
    }
  };

  const decline = async () => {
    if (!active) return;
    setSubmitting(true);
    try {
      const response = await fetchAdminApi(
        `/api/admin/extend-requests/${active.id}/reject`,
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
        requestId: active.id,
        bookingId: active.bookingId,
        status: "rejected",
        minutes: active.minutes,
        resolvedAt: data.resolvedAt ?? new Date().toISOString(),
      }).catch(() => {});
      setQueue((prev) => prev.filter((row) => row.id !== active.id));
      toast.message("Extend request declined");
    } finally {
      setSubmitting(false);
    }
  };

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
        {active ? (
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
                  {active.customerName || "Guest"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {active.staffName}
                  {active.roomName ? ` · ${active.roomName}` : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Now ends {formatAmPmTime(active.bookingEndsAt)} · extend +
                  {formatDurationLabel(active.minutes)}
                </p>
                {active.customerPhone ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {active.customerPhone}
                    {active.customerPostcode
                      ? ` · ${active.customerPostcode}`
                      : ""}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Service
                </p>
                <div className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground ring-2 ring-primary/20">
                  +{formatDurationLabel(active.minutes)} extend
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

function playChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    window.setTimeout(() => void ctx.close(), 300);
  } catch {
    // ignore
  }
}
