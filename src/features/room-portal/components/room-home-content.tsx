"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import {
  canCheckInToBooking,
  getActiveCheckedInBooking,
  isBookingCheckedIn,
} from "@/features/booking/lib/booking-check-in";
import { getAvailableExtendMinutes } from "@/features/booking/lib/booking-extend";
import {
  playServiceEndAlarm,
  unlockBookingAudio,
} from "@/features/booking/lib/booking-alert-sound";
import { broadcastServiceEnd } from "@/features/booking/lib/booking-realtime";
import { useBookingRealtime } from "@/features/booking/lib/booking-schedule-realtime";
import {
  formatAmPmTime,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";
import {
  applyPricingAdjustments,
  DEFAULT_PRICING_ADJUSTMENTS,
  type PricingAdjustments,
} from "@/features/services/lib/pricing-adjustments";
import {
  formatPriceFromCents,
  formatServiceOptionLabel,
} from "@/features/services";
import { broadcastStaffPresence } from "@/features/staff/lib/staff-presence-realtime";
import { useTenant } from "@/features/tenants";
import { useNowTick } from "@/hooks/use-now-tick";
import { cn } from "@/lib/utils";

import { useRoomSession } from "./room-layout-gate";
import { RoomPwaSetup } from "./room-pwa-setup";

interface StaffUser {
  id: string;
  name: string;
}

interface RoomServiceOption {
  durationMinutes: number;
  priceCents: number;
}

interface CompanionBooking {
  id: string;
  staffId: string;
  staffName: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
}

const EXTEND_OPTIONS = [10, 15, 20] as const;

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function PinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <div className="mx-auto w-full max-w-md space-y-5 md:max-w-lg md:space-y-6">
      <div className="flex justify-center gap-4 md:gap-5">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "size-3.5 rounded-full border-2 md:size-4",
              value.length > index
                ? "border-primary bg-primary"
                : "border-border bg-transparent",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {keys.map((key, index) => {
          if (!key) return <span key={`empty-${index}`} />;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              className="h-16 rounded-2xl border border-border bg-card text-2xl font-semibold text-foreground shadow-sm active:scale-[0.98] active:bg-muted disabled:opacity-40 md:h-20 md:text-3xl"
              onClick={() => {
                if (key === "del") {
                  onChange(value.slice(0, -1));
                  return;
                }
                if (value.length >= 4) return;
                onChange(value + key);
              }}
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function bookingStateLabel(booking: AdminBooking, now: Date): string {
  if (isBookingCheckedIn(booking)) {
    return "In room";
  }
  if (canCheckInToBooking(booking, now)) {
    return "Ready";
  }
  if (new Date(booking.endsAt) <= now) return "Ended";
  return "Booked";
}

export function RoomHomeContent() {
  const router = useRouter();
  const tenant = useTenant();
  const roomSession = useRoomSession();
  const roomLabel = roomSession?.roomName ?? "This room";
  const timeZone = tenant.settings.timezone || "Australia/Sydney";
  const now = useNowTick(1000);
  const today = todayDateInZone(timeZone, now);

  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [staffBookings, setStaffBookings] = useState<AdminBooking[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [companions, setCompanions] = useState<CompanionBooking[]>([]);
  const [addingStaff, setAddingStaff] = useState(false);
  const [joinPin, setJoinPin] = useState("");
  const [joinDuration, setJoinDuration] = useState("");
  const [joinPayment, setJoinPayment] = useState<InternalPaymentMethod | "">(
    "",
  );
  const [joinLoading, setJoinLoading] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<RoomServiceOption[]>([]);
  const [pricingAdjustments, setPricingAdjustments] =
    useState<PricingAdjustments>(DEFAULT_PRICING_ADJUSTMENTS);
  const [currency, setCurrency] = useState(
    () => tenant.settings.currency || "AUD",
  );
  const autoEndingRef = useRef<string | null>(null);

  const loadRoomSchedule = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) setLoadingSchedule(true);
    try {
      const response = await fetch(`/api/room/schedule?date=${today}`);
      const data = (await response.json()) as {
        bookings?: AdminBooking[];
        error?: string;
        code?: string;
      };
      if (response.status === 403 && data.code === "ROOM_LOGIN_REQUIRED") {
        router.replace("/room/login");
        return;
      }
      if (!response.ok) {
        if (!opts?.soft) {
          toast.error("Could not load schedule", { description: data.error });
        }
        return;
      }
      setBookings(data.bookings ?? []);
    } finally {
      if (!opts?.soft) setLoadingSchedule(false);
    }
  }, [router, today]);

  const loadStaffMe = useCallback(async () => {
    const response = await fetch("/api/staff/auth/me");
    const data = (await response.json()) as {
      user?: { role: string; staffId?: string; name?: string } | null;
    };
    if (data.user?.role === "staff" && data.user.staffId) {
      setStaff({ id: data.user.staffId, name: data.user.name ?? "Staff" });
      return true;
    }
    setStaff(null);
    return false;
  }, []);

  const loadStaffSchedule = useCallback(async () => {
    const response = await fetch(`/api/staff/schedule?date=${today}`);
    const data = (await response.json()) as {
      bookings?: AdminBooking[];
    };
    if (response.ok) {
      setStaffBookings(data.bookings ?? []);
    }
  }, [today]);

  const refreshAll = useCallback(
    async (opts?: { soft?: boolean }) => {
      await loadRoomSchedule(opts);
      const signedIn = await loadStaffMe();
      if (signedIn) await loadStaffSchedule();
      else setStaffBookings([]);
    },
    [loadRoomSchedule, loadStaffMe, loadStaffSchedule],
  );

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useBookingRealtime(tenant.id, () => {
    void refreshAll({ soft: true });
  });

  // Tablet fallback if realtime is delayed or drops.
  useEffect(() => {
    const id = window.setInterval(() => {
      void refreshAll({ soft: true });
    }, 45_000);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const submitPin = async (nextPin: string) => {
    if (nextPin.length !== 4 || pinLoading) return;
    setPinLoading(true);
    try {
      await unlockBookingAudio();
      const response = await fetch("/api/room/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: nextPin }),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        staff?: StaffUser;
      };

      if (response.status === 403 && data.code === "ROOM_LOGIN_REQUIRED") {
        toast.error("Room login required", { description: data.error });
        router.replace("/room/login");
        return;
      }

      if (!response.ok) {
        toast.error("Could not sign in", { description: data.error });
        setPin("");
        return;
      }

      const nextStaff = data.staff ?? null;
      setStaff(nextStaff);
      setPin("");

      const scheduleRes = await fetch(`/api/staff/schedule?date=${today}`);
      const scheduleData = (await scheduleRes.json()) as {
        bookings?: AdminBooking[];
      };
      const nextBookings = scheduleRes.ok ? (scheduleData.bookings ?? []) : [];
      setStaffBookings(nextBookings);
      await loadRoomSchedule();

      const resumed = nextBookings.some((booking) =>
        isBookingCheckedIn(booking),
      );

      if (resumed) {
        toast.success(`Welcome back ${nextStaff?.name ?? ""}`.trim(), {
          description: "Service still running — timer resumed.",
        });
      } else {
        toast.success(`Welcome ${nextStaff?.name ?? ""}`.trim());
      }
      if (nextStaff) {
        void broadcastStaffPresence(tenant.slug, {
          type: "online",
          staffId: nextStaff.id,
          staffName: nextStaff.name,
          roomName: roomLabel,
        }).catch(() => {});
      }
    } finally {
      setPinLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      void submitPin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- submit when PIN completes
  }, [pin]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/service-options");
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as {
        options?: RoomServiceOption[];
        currency?: string;
        pricingAdjustments?: PricingAdjustments;
      };
      if (cancelled) return;
      const options = data.options ?? [];
      setServiceOptions(options);
      if (data.currency) setCurrency(data.currency);
      if (data.pricingAdjustments) {
        setPricingAdjustments(data.pricingAdjustments);
      }
      if (options[0]) setJoinDuration(String(options[0].durationMinutes));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeBooking = useMemo(() => {
    if (!staff) return null;
    return getActiveCheckedInBooking(staffBookings);
  }, [staff, staffBookings]);

  const loadCompanions = useCallback(async (bookingId: string) => {
    const response = await fetch(`/api/room/bookings/${bookingId}/staff`);
    const data = (await response.json()) as {
      companions?: CompanionBooking[];
    };
    if (response.ok) {
      setCompanions(data.companions ?? []);
    }
  }, []);

  useEffect(() => {
    if (!activeBooking) {
      setCompanions([]);
      setAddingStaff(false);
      setJoinPin("");
      setJoinPayment("");
      return;
    }
    void loadCompanions(activeBooking.id);
  }, [activeBooking, loadCompanions]);

  const joinOption = useMemo(
    () =>
      serviceOptions.find(
        (option) => String(option.durationMinutes) === joinDuration,
      ),
    [serviceOptions, joinDuration],
  );

  const joinPriceBreakdown = useMemo(() => {
    if (!joinOption || !activeBooking) return null;
    return applyPricingAdjustments({
      baseCents: joinOption.priceCents,
      startsAtIso: new Date().toISOString(),
      timeZone,
      channel: "internal",
      adjustments: pricingAdjustments,
      paymentMethod:
        joinPayment === "cash" || joinPayment === "card" ? joinPayment : null,
    });
  }, [
    joinOption,
    activeBooking,
    timeZone,
    pricingAdjustments,
    joinPayment,
  ]);

  const createCompanionBooking = async () => {
    if (!activeBooking) return;
    if (joinPin.length !== 4) {
      toast.error("Enter the second staff PIN");
      return;
    }
    if (!joinDuration) {
      toast.error("Select a service duration");
      return;
    }
    if (joinPayment !== "cash" && joinPayment !== "card") {
      toast.error("Select cash or card");
      return;
    }

    setJoinLoading(true);
    try {
      const response = await fetch(
        `/api/room/bookings/${activeBooking.id}/staff`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pin: joinPin,
            durationMinutes: Number(joinDuration),
            paymentMethod: joinPayment,
          }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        joined?: { id: string; name: string };
        booking?: { priceCents?: number };
      };
      if (!response.ok) {
        toast.error("Could not add staff booking", {
          description: data.error,
        });
        setJoinPin("");
        return;
      }

      const priceLabel =
        data.booking?.priceCents != null
          ? formatPriceFromCents(data.booking.priceCents, currency)
          : null;
      toast.success(`${data.joined?.name ?? "Staff"} booking created`, {
        description: [priceLabel, "Starts now"]
          .filter(Boolean)
          .join(" · "),
      });
      setAddingStaff(false);
      setJoinPin("");
      setJoinPayment("");
      await Promise.all([
        loadCompanions(activeBooking.id),
        loadStaffSchedule(),
        loadRoomSchedule(),
      ]);
    } finally {
      setJoinLoading(false);
    }
  };

  const staffDayBookings = useMemo(() => {
    if (!staff) return [];
    return staffBookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
        (!activeBooking || booking.id !== activeBooking.id),
    );
  }, [staff, staffBookings, activeBooking]);

  const remainingMs = activeBooking
    ? new Date(activeBooking.endsAt).getTime() - now.getTime()
    : null;

  const extendOptions = useMemo(() => {
    if (!activeBooking) return [] as number[];
    const blockingStarts = [
      ...bookings
        .filter(
          (row) =>
            row.id !== activeBooking.id &&
            row.status !== "cancelled" &&
            row.status !== "completed",
        )
        .map((row) => row.startsAt),
      ...staffBookings
        .filter(
          (row) =>
            row.id !== activeBooking.id &&
            row.status !== "cancelled" &&
            row.status !== "completed",
        )
        .map((row) => row.startsAt),
    ];
    return getAvailableExtendMinutes(
      activeBooking.endsAt,
      blockingStarts,
      EXTEND_OPTIONS,
      now,
    );
  }, [activeBooking, bookings, staffBookings, now]);

  const checkIn = async (bookingId: string) => {
    setActionId(bookingId);
    try {
      await unlockBookingAudio();
      const response = await fetch(`/api/room/bookings/${bookingId}/check-in`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        serviceWindowCapped?: boolean;
      };
      if (response.status === 403 && data.code === "ROOM_LOGIN_REQUIRED") {
        toast.error("Room login required", { description: data.error });
        router.replace("/room/login");
        return;
      }
      if (!response.ok) {
        toast.error("Could not enter room", { description: data.error });
        return;
      }
      toast.success("Checked in", {
        description: data.serviceWindowCapped
          ? "Timer ends before the next booking"
          : "Timer started from now",
      });
      await Promise.all([loadStaffSchedule(), loadRoomSchedule()]);
    } finally {
      setActionId(null);
    }
  };

  const endService = useCallback(
    async (booking: AdminBooking, reason: "manual" | "auto") => {
      if (autoEndingRef.current === booking.id && reason === "auto") return;
      if (reason === "auto") autoEndingRef.current = booking.id;
      setActionId(booking.id);
      try {
        if (reason === "auto") {
          try {
            await playServiceEndAlarm(3);
            await broadcastServiceEnd(tenant.slug, {
              bookingId: booking.id,
              staffId: booking.staffId,
              staffName: staff?.name ?? booking.staffName,
              roomName: booking.roomName ?? "Room",
              endedAt: new Date().toISOString(),
            });
          } catch {
            // Alarm/broadcast best-effort - still check out.
          }
        }

        const response = await fetch(
          `/api/room/bookings/${booking.id}/checkout`,
          { method: "POST" },
        );
        const data = (await response.json()) as {
          error?: string;
          code?: string;
        };
        if (!response.ok) {
          if (reason === "auto") autoEndingRef.current = null;
          toast.error("Could not end service", { description: data.error });
          return;
        }
        toast.success(
          reason === "auto" ? "Time is up — service ended" : "Service ended",
        );
        if (staff) {
          void broadcastStaffPresence(tenant.slug, {
            type: "offline",
            staffId: staff.id,
            staffName: staff.name,
            roomName: roomLabel,
          }).catch(() => {});
        }
        setStaff(null);
        setStaffBookings([]);
        setPin("");
        await loadRoomSchedule();
      } finally {
        setActionId(null);
      }
    },
    [loadRoomSchedule, roomLabel, staff, tenant.slug],
  );

  useEffect(() => {
    if (!activeBooking || remainingMs === null) return;
    if (remainingMs > 0) {
      if (autoEndingRef.current === activeBooking.id) {
        autoEndingRef.current = null;
      }
      return;
    }
    void endService(activeBooking, "auto");
  }, [activeBooking, remainingMs, endService]);

  const extendService = async (bookingId: string, minutes: number) => {
    setActionId(`extend-${bookingId}-${minutes}`);
    try {
      const response = await fetch(`/api/room/bookings/${bookingId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes }),
      });
      const data = (await response.json()) as {
        error?: string;
      };
      if (!response.ok) {
        toast.error("Could not extend", { description: data.error });
        return;
      }
      toast.success(`Extended +${minutes} min`);
      autoEndingRef.current = null;
      await Promise.all([loadStaffSchedule(), loadRoomSchedule()]);
    } finally {
      setActionId(null);
    }
  };

  const staffLogout = async () => {
    const current = staff;
    const serviceStillRunning = Boolean(activeBooking);
    // Lock tablet only — never check out / end the in-progress booking.
    await fetch("/api/room/staff/logout", { method: "POST" });
    if (current) {
      void broadcastStaffPresence(tenant.slug, {
        type: "offline",
        staffId: current.id,
        staffName: current.name,
        roomName: roomLabel,
      }).catch(() => {});
    }
    setStaff(null);
    setStaffBookings([]);
    setPin("");
    toast.success(
      serviceStillRunning
        ? "Tablet locked — service still running. Enter PIN to return."
        : "Tablet locked",
    );
  };

  const roomServiceInProgress = useMemo(
    () => bookings.some((booking) => isBookingCheckedIn(booking)),
    [bookings],
  );

  if (staff) {
    return (
      <div className="space-y-5 md:space-y-6">
        <RoomPwaSetup />

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
              {roomLabel}
            </p>
            <p className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              {staff.name}
            </p>
          </div>
          <AppButton
            type="button"
            variant="outline"
            className="h-12 shrink-0 rounded-2xl px-4 text-base md:h-14 md:px-5"
            onClick={() => void staffLogout()}
          >
            <LogOut className="size-5" />
            Lock
          </AppButton>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 md:space-y-6">
            {activeBooking ? (
              <div
                className={cn(
                  "rounded-3xl border p-5 md:p-7",
                  remainingMs !== null && remainingMs <= 60_000
                    ? "border-red-300 bg-red-50"
                    : "border-emerald-200 bg-emerald-50",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.18em] md:text-sm",
                    remainingMs !== null && remainingMs <= 60_000
                      ? "text-red-700"
                      : "text-emerald-700",
                  )}
                >
                  In room now
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground md:text-xl">
                  {formatAmPmTime(activeBooking.startsAt)} ·{" "}
                  {activeBooking.customerName || "Guest"}
                </p>
                <p className="mt-2 text-sm font-medium text-muted-foreground md:text-base">
                  Staff:{" "}
                  {[
                    staff.name,
                    ...companions.map((row) => row.staffName),
                  ].join(" + ")}
                </p>
                <p className="mt-4 text-6xl font-semibold tabular-nums tracking-tight text-foreground md:text-7xl">
                  {formatRemaining(remainingMs ?? 0)}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                  left · ends {formatAmPmTime(activeBooking.endsAt)}
                </p>

                {companions.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {companions.map((row) => (
                      <li
                        key={row.id}
                        className="rounded-2xl bg-card/80 px-4 py-3 text-sm text-foreground"
                      >
                        <span className="font-semibold">{row.staffName}</span>
                        {" · "}
                        {row.durationMinutes} min ·{" "}
                        {formatPriceFromCents(row.priceCents, currency)}
                        {" · ends "}
                        {formatAmPmTime(row.endsAt)}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-5">
                  {addingStaff ? (
                    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Second staff booking
                        </p>
                        <button
                          type="button"
                          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                          onClick={() => {
                            setAddingStaff(false);
                            setJoinPin("");
                            setJoinPayment("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Staff PIN
                        </p>
                        <PinPad
                          value={joinPin}
                          onChange={setJoinPin}
                          disabled={joinLoading}
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Service
                        </p>
                        <div className="space-y-2">
                          {serviceOptions.map((option) => {
                            const value = String(option.durationMinutes);
                            const selected = joinDuration === value;
                            return (
                              <button
                                key={option.durationMinutes}
                                type="button"
                                onClick={() => setJoinDuration(value)}
                                className={cn(
                                  "flex min-h-12 w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold",
                                  selected
                                    ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/20"
                                    : "border-border bg-background text-foreground",
                                )}
                              >
                                {formatServiceOptionLabel(
                                  option.durationMinutes,
                                  option.priceCents,
                                  currency,
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {joinPriceBreakdown ? (
                        <div className="flex items-baseline justify-between rounded-xl bg-muted px-3 py-2.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Total
                          </p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatPriceFromCents(
                              joinPriceBreakdown.totalCents,
                              currency,
                            )}
                          </p>
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
                            const selected = joinPayment === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setJoinPayment(option.value)}
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
                        <p className="mt-2 text-xs text-muted-foreground">
                          Starts now · guest details copied from this booking
                        </p>
                      </div>

                      <AppButton
                        type="button"
                        className="h-14 w-full rounded-2xl text-lg"
                        disabled={
                          joinLoading ||
                          joinPin.length !== 4 ||
                          !joinDuration ||
                          !joinPayment
                        }
                        onClick={() => void createCompanionBooking()}
                      >
                        {joinLoading ? "Creating..." : "Create second booking"}
                      </AppButton>
                    </div>
                  ) : (
                    <AppButton
                      type="button"
                      variant="outline"
                      className="h-14 w-full rounded-2xl bg-card text-lg md:h-16"
                      onClick={() => {
                        setAddingStaff(true);
                        setJoinPin("");
                        setJoinPayment("");
                      }}
                    >
                      Add second staff
                    </AppButton>
                  )}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
                    Extend time
                  </p>
                  {extendOptions.length === 0 ? (
                    <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                      No extend available — next booking is too soon.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {extendOptions.map((minutes) => (
                        <AppButton
                          key={minutes}
                          type="button"
                          variant="outline"
                          className="h-14 rounded-2xl bg-card text-lg md:h-16"
                          disabled={Boolean(actionId)}
                          onClick={() =>
                            void extendService(activeBooking.id, minutes)
                          }
                        >
                          +{minutes}m
                        </AppButton>
                      ))}
                    </div>
                  )}
                  {extendOptions.length > 0 &&
                  extendOptions.length < EXTEND_OPTIONS.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Limited by the next booking in this room.
                    </p>
                  ) : null}
                </div>

                <AppButton
                  type="button"
                  className="mt-5 h-14 w-full rounded-2xl bg-red-700 text-lg text-white hover:bg-red-800 md:h-16 md:text-xl"
                  disabled={actionId === activeBooking.id}
                  onClick={() => void endService(activeBooking, "manual")}
                >
                  {actionId === activeBooking.id ? "Ending..." : "End service"}
                </AppButton>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Only this button ends the service. Lock keeps it running.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-5 py-5 md:px-6">
                <p className="text-base font-semibold text-foreground md:text-lg">
                  Start service to add a second staff
                </p>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  Tap <span className="font-semibold text-foreground">Enter</span>{" "}
                  on your booking. After check-in, create a second booking with
                  another staff PIN, service length, and cash/card — guest
                  details are copied automatically.
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <p className="text-base font-semibold md:text-lg">
                Your bookings today
              </p>
              <ul className="mt-4 space-y-3">
                {staffDayBookings.length === 0 && !activeBooking ? (
                  <li className="rounded-2xl bg-muted px-4 py-5 text-base text-muted-foreground">
                    No bookings for you today yet.
                  </li>
                ) : (
                  staffDayBookings.map((booking) => {
                    const ready = canCheckInToBooking(booking, now);
                    const label = bookingStateLabel(booking, now);
                    return (
                      <li
                        key={booking.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 px-4 py-4"
                      >
                        <div className="min-w-0">
                          <p className="text-base font-medium md:text-lg">
                            {formatAmPmTime(booking.startsAt)} ·{" "}
                            {booking.customerName || "Guest"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {label}
                            {booking.roomName ? ` · ${booking.roomName}` : ""}
                          </p>
                        </div>
                        {ready ? (
                          <AppButton
                            type="button"
                            className="h-12 shrink-0 rounded-2xl px-5 text-base md:h-14 md:px-6 md:text-lg"
                            disabled={actionId === booking.id}
                            onClick={() => void checkIn(booking.id)}
                          >
                            Enter
                          </AppButton>
                        ) : (
                          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground md:text-sm">
                            {label}
                          </span>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          <RoomScheduleList
            bookings={bookings.filter(
              (booking) =>
                booking.staffId === staff.id ||
                booking.additionalStaff?.some((member) => member.id === staff.id),
            )}
            loading={loadingSchedule}
            now={now}
            roomLabel={roomLabel}
            staffOnly
          />
        </div>
      </div>
    );
  }

  const changeRoom = async () => {
    await fetch("/api/room/auth/logout", { method: "POST" });
    router.replace("/room/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-[calc(100svh-2rem)] flex-col justify-center md:min-h-[calc(100svh-4rem)]">
      <RoomPwaSetup />
      <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-border bg-card px-6 py-10 shadow-sm md:max-w-3xl md:px-12 md:py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground md:text-sm">
          This tablet
        </p>
        <h1 className="mt-3 text-center text-6xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl">
          {roomLabel}
        </h1>
        {roomServiceInProgress ? (
          <p className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 md:text-base">
            Service in progress — enter staff PIN to return. Lock does not end
            the service.
          </p>
        ) : null}
        <p className="mt-8 text-center text-base font-medium text-muted-foreground md:mt-10 md:text-lg">
          Staff PIN
        </p>
        <div className="mt-5 md:mt-6">
          <PinPad value={pin} onChange={setPin} disabled={pinLoading} />
        </div>
        <button
          type="button"
          onClick={() => void changeRoom()}
          className="mt-10 w-full text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline md:mt-12 md:text-base"
        >
          Change room
        </button>
      </div>
    </div>
  );
}

function RoomScheduleList({
  bookings,
  loading,
  now,
  roomLabel,
  staffOnly = false,
}: {
  bookings: AdminBooking[];
  loading: boolean;
  now: Date;
  roomLabel: string;
  staffOnly?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <p className="text-base font-semibold md:text-lg">
        {staffOnly ? `Your bookings · ${roomLabel}` : `Today · ${roomLabel}`}
      </p>
      {loading ? (
        <p className="mt-4 text-base text-muted-foreground">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="mt-4 text-base text-muted-foreground">
          {staffOnly
            ? "No bookings for you in this room today."
            : "No bookings for this room today."}
        </p>
      ) : (
        <ul className="mt-4 max-h-[min(28rem,50vh)] space-y-2 overflow-y-auto md:max-h-[min(36rem,60vh)]">
          {bookings.map((booking) => (
            <li
              key={booking.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-foreground">
                  {formatAmPmTime(booking.startsAt)} ·{" "}
                  {booking.customerName || "Guest"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {booking.staffName}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground md:text-sm">
                {bookingStateLabel(booking, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
