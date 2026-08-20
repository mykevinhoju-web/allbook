"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

import { AppButton, toast } from "@/components/common";
import { Input } from "@/components/ui/input";
import {
  canCheckInToBooking,
  getActiveCheckedInBooking,
  isBookingCheckedIn,
} from "@/features/booking/lib/booking-check-in";
import { getAvailableExtendMinutes } from "@/features/booking/lib/booking-extend";
import { parsePairBookingId } from "@/features/booking/lib/booking-pair";
import { isPendingRoomStartBooking } from "@/features/booking/lib/room-start";
import {
  formatAuMobileInput,
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "@/features/booking/lib/au-contact";
import {
  formatCustomerBookingName,
  isValidCustomerBookingNameParts,
} from "@/features/booking/lib/customer-booking-name";
import {
  BookingCustomerContactFields,
  defaultBookingCustomerContact,
  type BookingCustomerContactValues,
} from "@/features/booking/components/checkout/booking-customer-contact-fields";
import {
  playServiceEndAlarm,
  startServiceEndAlarmLoop,
  stopServiceEndAlarmLoop,
  unlockBookingAudio,
} from "@/features/booking/lib/booking-alert-sound";
import {
  broadcastExtendRequest,
  broadcastServiceEnd,
  broadcastStartRequest,
  subscribeToBookingAlerts,
} from "@/features/booking/lib/booking-realtime";
import { useBookingRealtime } from "@/features/booking/lib/booking-schedule-realtime";
import {
  formatAmPmTime,
  formatDurationLabel,
  todayDateInZone,
} from "@/features/booking/lib/schedule-utils";
import type { AdminBooking } from "@/features/booking/types/admin-booking";
import type { InternalPaymentMethod } from "@/features/booking/lib/internal-payment-method";
import { paymentMethodForPricing } from "@/features/booking/lib/internal-payment-method";
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
import {
  clearRoomClientSession,
  hasRoomPinGate,
  setRoomPinGate,
} from "../lib/room-session-gate";
import { useIdleStaffLogout } from "../hooks/use-idle-staff-logout";

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
  roomId?: string | null;
  roomName?: string | null;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  priceCents: number;
  customerName?: string | null;
  status?: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
}

function visitToAdminBooking(row: CompanionBooking): AdminBooking {
  return {
    id: row.id,
    staffId: row.staffId,
    staffName: row.staffName,
    roomId: row.roomId ?? null,
    roomName: row.roomName ?? null,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    durationMinutes: row.durationMinutes,
    priceCents: row.priceCents,
    status: row.status ?? "confirmed",
    checkedOutAt: row.checkedOutAt ?? null,
    checkedInAt: row.checkedInAt ?? null,
    customerName: row.customerName ?? null,
    customerPhone: null,
    customerPostcode: null,
    customerEmail: null,
    notes: null,
  };
}

function formatRemaining(ms: number): string {
  const overtime = ms < 0;
  const totalSec = Math.ceil(Math.abs(ms) / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const label = `${mins}:${secs.toString().padStart(2, "0")}`;
  return overtime ? `-${label}` : label;
}

/** e.g. 11:25 AM~12:25 PM 1hr Service */
function formatRoomServiceWindow(
  startsAt: string,
  endsAt: string,
  durationMinutes: number,
): string {
  return `${formatAmPmTime(startsAt)}~${formatAmPmTime(endsAt)} ${formatDurationLabel(durationMinutes)} Service`;
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
  if (isPendingRoomStartBooking(booking)) {
    return "Waiting admin";
  }
  if (isBookingCheckedIn(booking)) {
    return "In room";
  }
  if (canCheckInToBooking(booking, now)) {
    return "Ready";
  }
  if (new Date(booking.endsAt) <= now) return "Ended";
  return "Booked";
}

function staffBookingsTodayTitle(name: string): string {
  const trimmed = name.trim() || "Staff";
  const possessive = /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
  return `${possessive} bookings today`;
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
  const [visitPrimary, setVisitPrimary] = useState<CompanionBooking | null>(
    null,
  );
  const [visitSchedules, setVisitSchedules] = useState<
    Record<string, AdminBooking[]>
  >({});
  const [addingStaff, setAddingStaff] = useState(false);
  const [joinPin, setJoinPin] = useState("");
  const [joinDuration, setJoinDuration] = useState("");
  const [joinPayment, setJoinPayment] = useState<InternalPaymentMethod | "">(
    "",
  );
  const [joinLoading, setJoinLoading] = useState(false);
  const [bookStartOpen, setBookStartOpen] = useState(false);
  const [bookStartContact, setBookStartContact] =
    useState<BookingCustomerContactValues>(defaultBookingCustomerContact);
  const [bookStartSplitCash, setBookStartSplitCash] = useState("");
  const [bookStartLoading, setBookStartLoading] = useState(false);
  const [phoneLookingUp, setPhoneLookingUp] = useState(false);
  const [phoneHint, setPhoneHint] = useState<string | null>(null);
  const lastLookupPhoneRef = useRef("");
  const bookStartContactRef = useRef(bookStartContact);
  bookStartContactRef.current = bookStartContact;
  const [pendingExtend, setPendingExtend] = useState<{
    requestId: string;
    minutes: number;
  } | null>(null);
  const [serviceOptions, setServiceOptions] = useState<RoomServiceOption[]>([]);
  const [pricingAdjustments, setPricingAdjustments] =
    useState<PricingAdjustments>(DEFAULT_PRICING_ADJUSTMENTS);
  const [currency, setCurrency] = useState(
    () => tenant.settings.currency || "AUD",
  );
  const autoEndingRef = useRef<string | null>(null);
  const endSoonAlarmedRef = useRef<string | null>(null);
  const endAlarmedRef = useRef<string | null>(null);
  /** Keep shared visit UI while the primary booking is still in service. */
  const visitAnchorIdRef = useRef<string | null>(null);

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
    // Room presence sync: validates server session + rewrites Room badge for admin list.
    const presenceRes = await fetch("/api/room/staff/presence", {
      method: "POST",
      credentials: "include",
    });
    const presenceData = (await presenceRes.json()) as {
      staff?: { id: string; name: string } | null;
      code?: string;
    };
    if (presenceRes.status === 403 && presenceData.code === "ROOM_LOGIN_REQUIRED") {
      router.replace("/room/login");
      setStaff(null);
      return false;
    }
    if (presenceData.staff?.id) {
      setStaff({
        id: presenceData.staff.id,
        name: presenceData.staff.name ?? "Staff",
      });
      return true;
    }

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
  }, [router]);

  const loadStaffSchedule = useCallback(async () => {
    const response = await fetch(`/api/staff/schedule?date=${today}`);
    const data = (await response.json()) as {
      bookings?: AdminBooking[];
    };
    if (response.ok) {
      setStaffBookings(data.bookings ?? []);
    }
  }, [today]);

  const loadVisit = useCallback(async (bookingId: string) => {
    const response = await fetch(`/api/room/bookings/${bookingId}/staff`);
    const data = (await response.json()) as {
      primary?: CompanionBooking;
      companions?: CompanionBooking[];
    };
    if (!response.ok) return null;
    const primary = data.primary ?? null;
    const seen = new Set<string>();
    const nextCompanions = (data.companions ?? []).filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
    setVisitPrimary(primary);
    setCompanions(nextCompanions);
    if (primary) {
      visitAnchorIdRef.current = primary.id;
    }
    return { primary, companions: nextCompanions };
  }, []);

  const clearVisit = useCallback(() => {
    visitAnchorIdRef.current = null;
    setCompanions([]);
    setVisitPrimary(null);
    setVisitSchedules({});
    setAddingStaff(false);
    setJoinPin("");
    setJoinPayment("");
  }, []);

  const refreshAll = useCallback(
    async (opts?: { soft?: boolean }) => {
      await loadRoomSchedule(opts);
      const signedIn = hasRoomPinGate() ? await loadStaffMe() : false;
      if (signedIn) await loadStaffSchedule();
      else {
        setStaff(null);
        setStaffBookings([]);
      }
      const anchor = visitAnchorIdRef.current;
      if (anchor) {
        const visit = await loadVisit(anchor);
        if (visit?.primary) {
          const primaryActive = isBookingCheckedIn(
            visitToAdminBooking(visit.primary),
          );
          const companionActive = visit.companions.some((row) =>
            isBookingCheckedIn(visitToAdminBooking(row)),
          );
          if (!primaryActive && !companionActive) {
            clearVisit();
          }
        }
      }
    },
    [clearVisit, loadRoomSchedule, loadStaffMe, loadStaffSchedule, loadVisit],
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
      setRoomPinGate();

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

  /** Logged-in staff's own checked-in booking (may be primary or companion). */
  const myActiveBooking = useMemo(() => {
    if (!staff) return null;
    return getActiveCheckedInBooking(staffBookings);
  }, [staff, staffBookings]);

  const signOutStaffCompletely = useCallback(async () => {
    const current = staff;
    setStaff(null);
    setStaffBookings([]);
    setPin("");
    clearVisit();
    await fetch("/api/room/staff/logout", {
      method: "POST",
      credentials: "include",
    });
    await fetch("/api/staff/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (current) {
      void broadcastStaffPresence(tenant.slug, {
        type: "offline",
        staffId: current.id,
        staffName: current.name,
        roomName: roomLabel,
      }).catch(() => {});
    }
  }, [clearVisit, roomLabel, staff, tenant.slug]);

  useIdleStaffLogout({
    enabled: Boolean(staff) && !myActiveBooking,
    onIdle: () => {
      void (async () => {
        await signOutStaffCompletely();
        toast.success("Signed out", {
          description: "No activity for 5 minutes outside a service.",
        });
      })();
    },
  });

  const pendingStartBooking = useMemo(() => {
    if (!staff) return null;
    return (
      staffBookings.find((row) => isPendingRoomStartBooking(row)) ??
      bookings.find(
        (row) =>
          row.staffId === staff.id && isPendingRoomStartBooking(row),
      ) ??
      null
    );
  }, [staff, staffBookings, bookings]);

  const loadVisitSchedules = useCallback(
    async (members: CompanionBooking[]) => {
      if (members.length === 0) {
        setVisitSchedules({});
        return;
      }
      const entries = await Promise.all(
        members.map(async (row) => {
          const response = await fetch(
            `/api/room/staff-schedule?staffId=${encodeURIComponent(row.staffId)}&date=${today}`,
          );
          const data = (await response.json()) as {
            bookings?: AdminBooking[];
          };
          return [
            row.staffId,
            response.ok ? (data.bookings ?? []) : [],
          ] as const;
        }),
      );
      setVisitSchedules(Object.fromEntries(entries));
    },
    [today],
  );

  useEffect(() => {
    if (myActiveBooking) {
      const anchor =
        parsePairBookingId(myActiveBooking.notes) ?? myActiveBooking.id;
      visitAnchorIdRef.current = anchor;
      void loadVisit(myActiveBooking.id);
      return;
    }

    const anchor = visitAnchorIdRef.current;
    if (!anchor) {
      clearVisit();
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await loadVisit(anchor);
      if (cancelled || !result?.primary) {
        if (!cancelled) clearVisit();
        return;
      }
      const primaryActive = isBookingCheckedIn(
        visitToAdminBooking(result.primary),
      );
      const companionActive = result.companions.some((row) =>
        isBookingCheckedIn(visitToAdminBooking(row)),
      );
      // Visit stays on screen while anyone in the pair is still in service.
      if (!primaryActive && !companionActive) {
        clearVisit();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [myActiveBooking, loadVisit, clearVisit]);

  const visitMembers = useMemo(() => {
    if (!visitPrimary) return [] as CompanionBooking[];
    return [visitPrimary, ...companions];
  }, [visitPrimary, companions]);

  useEffect(() => {
    void loadVisitSchedules(visitMembers);
  }, [visitMembers, loadVisitSchedules]);

  const isVisitPrimaryViewer = Boolean(
    staff &&
      myActiveBooking &&
      !parsePairBookingId(myActiveBooking.notes) &&
      (!visitPrimary || staff.id === visitPrimary.staffId),
  );

  /** Primary booking drives the shared visit layout (same for every joined staff). */
  const activeBooking = useMemo(() => {
    if (visitPrimary) return visitToAdminBooking(visitPrimary);
    return myActiveBooking;
  }, [visitPrimary, myActiveBooking]);

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
      paymentMethod: paymentMethodForPricing(joinPayment || null),
    });
  }, [joinOption, activeBooking, timeZone, pricingAdjustments, joinPayment]);

  const startPriceBreakdown = useMemo(() => {
    if (!joinOption) return null;
    return applyPricingAdjustments({
      baseCents: joinOption.priceCents,
      startsAtIso: new Date().toISOString(),
      timeZone,
      channel: "internal",
      adjustments: pricingAdjustments,
      paymentMethod: paymentMethodForPricing(joinPayment || null),
    });
  }, [joinOption, timeZone, pricingAdjustments, joinPayment]);

  const resetBookStartForm = () => {
    setBookStartContact(defaultBookingCustomerContact());
    setBookStartSplitCash("");
    setJoinPayment("");
    lastLookupPhoneRef.current = "";
    setPhoneHint(null);
    setPhoneLookingUp(false);
  };

  useEffect(() => {
    if (!bookStartOpen) return;
    const phone = bookStartContact.phone;
    if (!isValidAuMobile(phone)) {
      setPhoneHint(null);
      setPhoneLookingUp(false);
      return;
    }

    const normalized = normalizeAuMobile(phone);
    if (lastLookupPhoneRef.current === normalized) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPhoneLookingUp(true);
      void (async () => {
        try {
          const response = await fetch(
            `/api/room/customers/lookup?phone=${encodeURIComponent(normalized)}`,
          );
          const data = (await response.json()) as {
            customer?: {
              firstName: string;
              secondName: string;
              email: string | null;
              postcode: string | null;
            } | null;
          };

          if (cancelled) return;
          lastLookupPhoneRef.current = normalized;

          if (!response.ok || !data.customer) {
            setPhoneHint(null);
            return;
          }

          const guest = data.customer;
          const current = bookStartContactRef.current;
          if (normalizeAuMobile(current.phone) !== normalized) return;

          setBookStartContact({
            ...current,
            phone: formatAuMobileInput(normalized),
            firstName: guest.firstName || current.firstName,
            secondName: guest.secondName || current.secondName,
            postcode: guest.postcode
              ? formatAuPostcodeInput(guest.postcode)
              : current.postcode,
          });
          setPhoneHint("Saved contact filled in");
        } finally {
          if (!cancelled) setPhoneLookingUp(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [bookStartOpen, bookStartContact.phone]);

  const startWalkInNow = async () => {
    if (!joinDuration) {
      toast.error("Select a service duration");
      return;
    }
    if (
      !isValidCustomerBookingNameParts(
        bookStartContact.firstName,
        bookStartContact.secondName,
      )
    ) {
      toast.error("Enter first name and lastname initial");
      return;
    }
    if (!isValidAuMobile(bookStartContact.phone)) {
      toast.error("Enter a valid Australian mobile");
      return;
    }
    if (!isValidAuPostcode(bookStartContact.postcode)) {
      toast.error("Enter a valid Queensland postcode");
      return;
    }
    if (!joinPayment) {
      toast.error("Select a payment method");
      return;
    }

    const displayTotal = startPriceBreakdown?.totalCents ?? 0;
    let splitCashCents: number | undefined;
    if (joinPayment === "split") {
      const cash = Math.round(Number(bookStartSplitCash || 0) * 100);
      if (!Number.isFinite(cash) || cash <= 0 || cash >= displayTotal) {
        toast.error("Enter a cash amount less than the total");
        return;
      }
      splitCashCents = cash;
    }

    const guestName = formatCustomerBookingName(
      bookStartContact.firstName,
      bookStartContact.secondName,
    );

    setBookStartLoading(true);
    try {
      const response = await fetch("/api/room/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: Number(joinDuration),
          paymentMethod: joinPayment,
          splitCashCents,
          customerFirstName: bookStartContact.firstName,
          customerLastName: bookStartContact.secondName,
          customerPhone: normalizeAuMobile(bookStartContact.phone),
          customerPostcode: formatAuPostcodeInput(bookStartContact.postcode),
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        code?: string;
        booking?: { id?: string; priceCents?: number };
      };
      if (response.status === 403 && data.code === "ROOM_LOGIN_REQUIRED") {
        toast.error("Room login required", { description: data.error });
        router.replace("/room/login");
        return;
      }
      if (!response.ok) {
        toast.error("Could not start booking", { description: data.error });
        return;
      }
      toast.success("Sent to admin", {
        description: "Waiting for approval before the service starts.",
      });
      setBookStartOpen(false);
      resetBookStartForm();
      const created = data.booking;
      if (created?.id) {
        void broadcastStartRequest(tenant.slug, {
          bookingId: created.id,
          staffName: staff?.name ?? "Staff",
          roomName: roomLabel,
          customerName: guestName,
          durationMinutes: Number(joinDuration),
          requestedAt: new Date().toISOString(),
        }).catch(() => {});
      }
      await refreshAll();
    } finally {
      setBookStartLoading(false);
    }
  };

  const createCompanionBooking = async () => {
    if (!activeBooking || !isVisitPrimaryViewer) return;
    if (joinPin.length !== 4) {
      toast.error("Enter the staff PIN");
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
        loadVisit(activeBooking.id),
        loadStaffSchedule(),
        loadRoomSchedule(),
      ]);
    } finally {
      setJoinLoading(false);
    }
  };

  const visitBookingIds = useMemo(
    () => new Set(visitMembers.map((row) => row.id)),
    [visitMembers],
  );

  const staffDayBookings = useMemo(() => {
    if (!staff) return [];
    return staffBookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
        !visitBookingIds.has(booking.id) &&
        (!myActiveBooking || booking.id !== myActiveBooking.id),
    );
  }, [staff, staffBookings, visitBookingIds, myActiveBooking]);

  const visitDaySections = useMemo(() => {
    return visitMembers.map((member) => ({
      staffId: member.staffId,
      staffName: member.staffName,
      isSelf: staff?.id === member.staffId,
      bookings: (visitSchedules[member.staffId] ?? []).filter(
        (booking) =>
          booking.status !== "cancelled" && !visitBookingIds.has(booking.id),
      ),
    }));
  }, [visitMembers, visitSchedules, visitBookingIds, staff]);

  const remainingMs = activeBooking
    ? new Date(activeBooking.endsAt).getTime() - now.getTime()
    : null;

  const myRemainingMs = myActiveBooking
    ? new Date(myActiveBooking.endsAt).getTime() - now.getTime()
    : null;

  const serviceStaffNames = useMemo(
    () => visitMembers.map((row) => row.staffName),
    [visitMembers],
  );

  const serviceDurationOptions = useMemo(
    () => serviceOptions.map((option) => option.durationMinutes),
    [serviceOptions],
  );

  const extendOptions = useMemo(() => {
    if (!activeBooking || serviceDurationOptions.length === 0) {
      return [] as number[];
    }
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
      serviceDurationOptions,
      now,
    );
  }, [
    activeBooking,
    bookings,
    staffBookings,
    now,
    serviceDurationOptions,
  ]);

  useEffect(() => {
    if (!activeBooking || !isVisitPrimaryViewer) {
      setPendingExtend(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const response = await fetch(
        `/api/room/bookings/${activeBooking.id}/extend-request`,
      );
      if (!response.ok || cancelled) return;
      const data = (await response.json()) as {
        request?: { id: string; minutes: number } | null;
      };
      if (cancelled) return;
      setPendingExtend(
        data.request
          ? { requestId: data.request.id, minutes: data.request.minutes }
          : null,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBooking, isVisitPrimaryViewer]);

  useEffect(() => {
    if (!activeBooking) return;
    return subscribeToBookingAlerts(
      tenant.slug,
      () => {},
      undefined,
      undefined,
      undefined,
      (payload) => {
        if (payload.bookingId !== activeBooking.id) return;
        setPendingExtend(null);
        autoEndingRef.current = null;
        if (payload.status === "approved") {
          void playServiceEndAlarm(2);
          toast.success(
            `Extended +${formatDurationLabel(payload.minutes)}`,
            {
              description: payload.newEndsAt
                ? `New end ${formatAmPmTime(payload.newEndsAt)}`
                : "Timer updated",
              duration: 10_000,
            },
          );
        } else {
          void playServiceEndAlarm(1);
          toast.error("Extend declined by admin", { duration: 8_000 });
        }
        void Promise.all([
          loadStaffSchedule(),
          loadRoomSchedule(),
          myActiveBooking ? loadVisit(myActiveBooking.id) : Promise.resolve(),
        ]);
      },
    );
  }, [
    activeBooking,
    tenant.slug,
    loadStaffSchedule,
    loadRoomSchedule,
    loadVisit,
    myActiveBooking,
  ]);

  useEffect(() => {
    if (!staff) return;
    return subscribeToBookingAlerts(
      tenant.slug,
      () => {},
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      (payload) => {
        if (payload.status === "approved") {
          toast.success("Admin approved — service started");
        } else {
          toast.error("Admin declined the start request");
        }
        void refreshAll({ soft: true });
      },
    );
  }, [staff, tenant.slug, refreshAll]);

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
      // Stop repeating alarms immediately when the tablet ends the service.
      stopServiceEndAlarmLoop();
      if (endAlarmedRef.current === booking.id) {
        endAlarmedRef.current = null;
      }
      if (endSoonAlarmedRef.current === booking.id) {
        endSoonAlarmedRef.current = null;
      }
      setActionId(booking.id);
      const pairPrimaryId = parsePairBookingId(booking.notes);
      const endingCompanion = Boolean(pairPrimaryId);
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

        await loadRoomSchedule();
        if (staff) await loadStaffSchedule();

        // Companion finished while primary may still be in service — keep the
        // shared visit on screen (Jessica stays visible as Ended).
        if (endingCompanion && pairPrimaryId) {
          visitAnchorIdRef.current = pairPrimaryId;
          const visit = await loadVisit(pairPrimaryId);
          const primaryActive = Boolean(
            visit?.primary &&
              isBookingCheckedIn(visitToAdminBooking(visit.primary)),
          );
          if (primaryActive) {
            return;
          }
        }

        if (staff) {
          void broadcastStaffPresence(tenant.slug, {
            type: "offline",
            staffId: staff.id,
            staffName: staff.name,
            roomName: roomLabel,
          }).catch(() => {});
        }
        clearVisit();
        setStaff(null);
        setStaffBookings([]);
        setPin("");
        await fetch("/api/room/staff/logout", {
          method: "POST",
          credentials: "include",
        });
        await fetch("/api/staff/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } finally {
        setActionId(null);
      }
    },
    [
      clearVisit,
      loadRoomSchedule,
      loadStaffSchedule,
      loadVisit,
      roomLabel,
      staff,
      tenant.slug,
    ],
  );

  useEffect(() => {
    const END_SOON_MS = 5 * 60_000;

    if (!myActiveBooking || myRemainingMs === null) {
      stopServiceEndAlarmLoop();
      endAlarmedRef.current = null;
      endSoonAlarmedRef.current = null;
      return;
    }

    const bookingId = myActiveBooking.id;

    if (myRemainingMs > 0) {
      stopServiceEndAlarmLoop();
      endAlarmedRef.current = null;

      if (myRemainingMs <= END_SOON_MS) {
        if (endSoonAlarmedRef.current !== bookingId) {
          endSoonAlarmedRef.current = bookingId;
          void playServiceEndAlarm(1);
        }
      } else if (endSoonAlarmedRef.current === bookingId) {
        endSoonAlarmedRef.current = null;
      }

      return;
    }

    if (endAlarmedRef.current !== bookingId) {
      endAlarmedRef.current = bookingId;
      endSoonAlarmedRef.current = bookingId;
      void unlockBookingAudio().catch(() => {});
      startServiceEndAlarmLoop();
    }
  }, [myActiveBooking, myRemainingMs]);

  useEffect(() => {
    return () => {
      stopServiceEndAlarmLoop();
    };
  }, []);

  const requestExtend = async (bookingId: string, minutes: number) => {
    setActionId(`extend-${bookingId}-${minutes}`);
    try {
      // Unlock audio so the room can hear approve/decline later.
      await unlockBookingAudio().catch(() => {});
      const response = await fetch(
        `/api/room/bookings/${bookingId}/extend-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes }),
        },
      );
      const data = (await response.json()) as {
        error?: string;
        request?: {
          id: string;
          minutes: number;
          staffName: string;
          roomName: string;
          customerName: string | null;
          createdAt: string;
        };
      };
      if (!response.ok || !data.request) {
        toast.error("Could not request extend", { description: data.error });
        return;
      }
      setPendingExtend({
        requestId: data.request.id,
        minutes: data.request.minutes,
      });
      toast.success("Sent to admin", {
        description: "Waiting for cash/card approval…",
      });
      void broadcastExtendRequest(tenant.slug, {
        requestId: data.request.id,
        bookingId,
        minutes: data.request.minutes,
        staffName: data.request.staffName,
        roomName: data.request.roomName,
        customerName: data.request.customerName,
        requestedAt: data.request.createdAt,
      }).catch(() => {});
    } finally {
      setActionId(null);
    }
  };

  const roomOut = async () => {
    const current = staff;
    clearRoomClientSession();
    setStaff(null);
    // Leave the room tablet completely — never check out / end the in-progress booking.
    await fetch("/api/room/staff/logout", {
      method: "POST",
      credentials: "include",
    });
    if (current) {
      void broadcastStaffPresence(tenant.slug, {
        type: "offline",
        staffId: current.id,
        staffName: current.name,
        roomName: roomLabel,
      }).catch(() => {});
    }
    await fetch("/api/room/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.replace("/room/login");
  };

  const roomServiceInProgress = useMemo(
    () => bookings.some((booking) => isBookingCheckedIn(booking)),
    [bookings],
  );

  if (staff) {
    return (
      <div className="space-y-5 md:space-y-6">
        {bookStartLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        <RoomPwaSetup />

        <div className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
              {roomLabel}
            </p>
            <p className="truncate text-2xl font-semibold tracking-tight md:text-3xl">
              {serviceStaffNames.length > 0
                ? serviceStaffNames.join(" + ")
                : staff.name}
            </p>
          </div>
          <AppButton
            type="button"
            variant="outline"
            className="h-12 shrink-0 rounded-2xl px-4 text-base md:h-14 md:px-5"
            onClick={() => void roomOut()}
          >
            <LogOut className="size-5" />
            Room Out
          </AppButton>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 md:space-y-6">
            {activeBooking ? (
              <>
              <div
                className={cn(
                  "rounded-3xl border p-5 md:p-7",
                  remainingMs !== null && remainingMs <= 60_000
                    ? "border-red-500/40 bg-red-950/55"
                    : "border-emerald-400/25 bg-emerald-950/45",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.18em] md:text-sm",
                    remainingMs !== null && remainingMs <= 60_000
                      ? "text-red-300"
                      : "text-emerald-300",
                  )}
                >
                  In room now · {activeBooking.staffName}
                </p>
                <p className="mt-2 text-lg font-semibold leading-snug text-foreground md:text-xl">
                  {formatRoomServiceWindow(
                    activeBooking.startsAt,
                    activeBooking.endsAt,
                    activeBooking.durationMinutes,
                  )}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                  {activeBooking.customerName || "Guest"}
                </p>
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
                  {remainingMs !== null && remainingMs <= 0
                    ? "Overtime"
                    : "Remaining"}
                </p>
                <p className="mt-1 text-6xl font-semibold tabular-nums tracking-tight text-foreground md:text-7xl">
                  {formatRemaining(remainingMs ?? 0)}
                </p>
                <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                  ends {formatAmPmTime(activeBooking.endsAt)}
                </p>

                {isVisitPrimaryViewer ? (
                <>
                <div className="mt-5">
                  {addingStaff ? (
                    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          Join staff booking
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
                        {joinLoading ? "Creating..." : "Create booking"}
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
                      Add staff
                    </AppButton>
                  )}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
                    Extend time
                  </p>
                  {pendingExtend ? (
                    <p className="rounded-2xl border border-amber-500/30 bg-amber-950/50 px-4 py-3 text-sm font-medium text-amber-100">
                      Waiting for admin approval · +
                      {formatDurationLabel(pendingExtend.minutes)}
                    </p>
                  ) : extendOptions.length === 0 ? (
                    <p className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                      No extend available — next booking is too soon, or no
                      service lengths fit.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {extendOptions.map((minutes) => (
                        <AppButton
                          key={minutes}
                          type="button"
                          variant="outline"
                          className="h-14 rounded-2xl bg-card text-base md:h-16 md:text-lg"
                          disabled={Boolean(actionId)}
                          onClick={() =>
                            void requestExtend(activeBooking.id, minutes)
                          }
                        >
                          +{formatDurationLabel(minutes)}
                        </AppButton>
                      ))}
                    </div>
                  )}
                  {!pendingExtend &&
                  extendOptions.length > 0 &&
                  extendOptions.length < serviceDurationOptions.length ? (
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
                  Only this button ends the service. Room Out does not end it.
                </p>
                </>
                ) : null}
              </div>

              {companions.map((row) => {
                const companionBooking = visitToAdminBooking(row);
                const companionActive = isBookingCheckedIn(companionBooking);
                const companionRemainingMs =
                  new Date(row.endsAt).getTime() - now.getTime();
                const ended = !companionActive;
                const overtime = companionActive && companionRemainingMs <= 0;
                const urgent =
                  companionActive && companionRemainingMs <= 60_000;
                const isSelf = staff.id === row.staffId;
                return (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-3xl border p-5 md:p-7",
                      ended
                        ? "border-border/60 bg-muted/30 opacity-90"
                        : urgent
                          ? "border-red-500/40 bg-red-950/55"
                          : "border-sky-400/25 bg-sky-950/45",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.18em] md:text-sm",
                        ended
                          ? "text-muted-foreground"
                          : urgent
                            ? "text-red-300"
                            : "text-sky-300",
                      )}
                    >
                      {ended
                        ? `Ended · ${row.staffName}`
                        : `In room now · ${row.staffName}`}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-snug text-foreground md:text-xl">
                      {formatRoomServiceWindow(
                        row.startsAt,
                        row.endsAt,
                        row.durationMinutes,
                      )}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                      {row.customerName ||
                        activeBooking.customerName ||
                        "Guest"}
                      {" · "}
                      {formatPriceFromCents(row.priceCents, currency)}
                    </p>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-sm">
                      {ended ? "Finished" : overtime ? "Overtime" : "Remaining"}
                    </p>
                    <p className="mt-1 text-6xl font-semibold tabular-nums tracking-tight text-foreground md:text-7xl">
                      {ended ? "0:00" : formatRemaining(companionRemainingMs)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">
                      ends {formatAmPmTime(row.endsAt)}
                    </p>
                    {isSelf && companionActive ? (
                      <>
                        <AppButton
                          type="button"
                          className="mt-5 h-14 w-full rounded-2xl bg-red-700 text-lg text-white hover:bg-red-800 md:h-16 md:text-xl"
                          disabled={actionId === row.id}
                          onClick={() =>
                            void endService(companionBooking, "manual")
                          }
                        >
                          {actionId === row.id ? "Ending..." : "End service"}
                        </AppButton>
                        <p className="mt-2 text-center text-xs text-muted-foreground">
                          Ends your booking only. Room Out does not end it.
                        </p>
                      </>
                    ) : null}
                  </div>
                );
              })}
              </>
            ) : pendingStartBooking ? (
              <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-5 py-5 md:px-6">
                <p className="text-base font-semibold text-foreground md:text-lg">
                  Waiting for admin
                </p>
                <p className="mt-2 text-sm text-muted-foreground md:text-base">
                  {pendingStartBooking.customerName || "Walk-in"} ·{" "}
                  {formatDurationLabel(pendingStartBooking.durationMinutes)} ·{" "}
                  {staff.name}. Service starts after admin approval.
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-muted/40 px-5 py-5 md:px-6">
                {bookStartOpen ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-base font-semibold text-foreground md:text-lg">
                        Book start
                      </p>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                        onClick={() => {
                          setBookStartOpen(false);
                          resetBookStartForm();
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {staff.name} · starts now in {roomLabel}
                    </p>
                    <BookingCustomerContactFields
                      phoneFirst
                      phoneLookingUp={phoneLookingUp}
                      phoneHint={phoneHint}
                      values={bookStartContact}
                      onChange={(next) => {
                        const phoneChanged =
                          normalizeAuMobile(next.phone) !==
                          normalizeAuMobile(bookStartContact.phone);
                        if (phoneChanged) {
                          lastLookupPhoneRef.current = "";
                          setPhoneHint(null);
                        }
                        setBookStartContact(next);
                      }}
                      fieldClass="h-12 rounded-xl border-border bg-background px-3 text-sm font-medium"
                      labelClass="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                      helperTextClass="text-xs text-muted-foreground"
                    />
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
                    {startPriceBreakdown ? (
                      <div className="flex items-baseline justify-between rounded-xl bg-muted px-3 py-2.5">
                        <p className="text-xs font-medium text-muted-foreground">
                          Total
                        </p>
                        <p className="text-lg font-semibold text-foreground">
                          {formatPriceFromCents(
                            startPriceBreakdown.totalCents,
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
                            { value: "split" as const, label: "Split" },
                            { value: "pre" as const, label: "Pre - Book" },
                          ] as const
                        ).map((option) => {
                          const selected = joinPayment === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setJoinPayment(option.value);
                                if (option.value !== "split") {
                                  setBookStartSplitCash("");
                                }
                              }}
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
                      {joinPayment === "split" ? (
                        <div className="mt-3 space-y-2 rounded-xl border border-border bg-background px-3 py-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Cash amount ({currency})
                          </p>
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            inputMode="decimal"
                            placeholder="e.g. 20"
                            value={bookStartSplitCash}
                            onChange={(event) =>
                              setBookStartSplitCash(event.target.value)
                            }
                            className="h-11 rounded-xl"
                          />
                          <p className="text-xs text-muted-foreground">
                            Remainder on card · no cash discount
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <AppButton
                      type="button"
                      className="h-14 w-full rounded-2xl text-lg"
                      disabled={
                        bookStartLoading ||
                        !joinDuration ||
                        !joinPayment ||
                        roomServiceInProgress
                      }
                      onClick={() => void startWalkInNow()}
                    >
                      {bookStartLoading ? "Sending..." : "Send to admin"}
                    </AppButton>
                  </div>
                ) : (
                  <>
                    <p className="text-base font-semibold text-foreground md:text-lg">
                      Walk-in guest
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground md:text-base">
                      Start a service now with {staff.name}. Time is now — no
                      need to pick a schedule slot.
                    </p>
                    <AppButton
                      type="button"
                      className="mt-4 h-14 w-full rounded-2xl text-lg md:h-16"
                      disabled={roomServiceInProgress}
                      onClick={() => {
                        setBookStartOpen(true);
                        resetBookStartForm();
                      }}
                    >
                      Book start
                    </AppButton>
                    {roomServiceInProgress ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        This room already has a service in progress.
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground md:text-base">
                        Or tap{" "}
                        <span className="font-semibold text-foreground">
                          Enter
                        </span>{" "}
                        on an existing booking below.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-5">
              {visitDaySections.length > 0 ? (
                visitDaySections.map((section) => (
                  <StaffDayBookingsCard
                    key={section.staffId}
                    title={staffBookingsTodayTitle(section.staffName)}
                    bookings={
                      section.isSelf ? staffDayBookings : section.bookings
                    }
                    emptyLabel={
                      myActiveBooking || activeBooking
                        ? `No other bookings for ${section.staffName} today.`
                        : `No bookings for ${section.staffName} today yet.`
                    }
                    now={now}
                    activeBooking={myActiveBooking}
                    roomServiceInProgress={roomServiceInProgress}
                    actionId={actionId}
                    onEnter={(bookingId) => void checkIn(bookingId)}
                    allowEnter={section.isSelf}
                  />
                ))
              ) : (
                <StaffDayBookingsCard
                  title={staffBookingsTodayTitle(staff.name)}
                  bookings={staffDayBookings}
                  emptyLabel={`No bookings for ${staff.name} today yet.`}
                  now={now}
                  activeBooking={myActiveBooking}
                  roomServiceInProgress={roomServiceInProgress}
                  actionId={actionId}
                  onEnter={(bookingId) => void checkIn(bookingId)}
                  allowEnter
                />
              )}
            </div>
          </div>

          <RoomScheduleList
            bookings={bookings.filter(
              (booking) =>
                booking.staffId === staff.id ||
                booking.additionalStaff?.some(
                  (member) => member.id === staff.id,
                ) ||
                visitBookingIds.has(booking.id),
            )}
            loading={loadingSchedule}
            now={now}
            roomLabel={roomLabel}
            staffOnly
            listTitle={`${roomLabel} today`}
            staffLabelById={
              serviceStaffNames.length > 0
                ? Object.fromEntries(
                    [...visitBookingIds].map((id) => [
                      id,
                      serviceStaffNames.join(" + "),
                    ]),
                  )
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  const changeRoom = async () => {
    clearRoomClientSession();
    await fetch("/api/room/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.replace("/room/login");
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
          <p className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-950/45 px-4 py-3 text-center text-sm font-medium text-emerald-200 md:text-base">
            Service in progress — enter staff PIN to return. Room Out does not
            end the service.
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

function StaffDayBookingsCard({
  title,
  bookings,
  emptyLabel,
  now,
  activeBooking,
  roomServiceInProgress,
  actionId,
  onEnter,
  allowEnter,
}: {
  title: string;
  bookings: AdminBooking[];
  emptyLabel: string;
  now: Date;
  activeBooking: AdminBooking | null;
  roomServiceInProgress: boolean;
  actionId: string | null;
  onEnter?: (bookingId: string) => void;
  allowEnter: boolean;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <p className="text-base font-semibold md:text-lg">{title}</p>
      <ul className="mt-4 space-y-3">
        {bookings.length === 0 ? (
          <li className="rounded-2xl bg-muted px-4 py-5 text-base text-muted-foreground">
            {emptyLabel}
          </li>
        ) : (
          bookings.map((booking) => {
            const ready =
              allowEnter &&
              canCheckInToBooking(booking, now) &&
              !activeBooking &&
              !roomServiceInProgress &&
              !isPendingRoomStartBooking(booking);
            const label = bookingStateLabel(booking, now);
            return (
              <li
                key={booking.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 px-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium md:text-lg">
                    {booking.customerName || "Guest"}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground/80 md:text-base">
                    {formatAmPmTime(booking.startsAt)} –{" "}
                    {formatAmPmTime(booking.endsAt)}
                    {" · "}
                    {booking.durationMinutes} min
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
                    onClick={() => onEnter?.(booking.id)}
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
  );
}

function RoomScheduleList({
  bookings,
  loading,
  now,
  roomLabel,
  staffOnly = false,
  listTitle,
  staffLabelById,
}: {
  bookings: AdminBooking[];
  loading: boolean;
  now: Date;
  roomLabel: string;
  staffOnly?: boolean;
  listTitle?: string;
  staffLabelById?: Record<string, string>;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
      <p className="text-base font-semibold md:text-lg">
        {listTitle ??
          (staffOnly ? `Your bookings · ${roomLabel}` : `Today · ${roomLabel}`)}
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
                  {booking.customerName || "Guest"}
                </p>
                <p className="truncate text-sm font-medium text-foreground/80">
                  {formatAmPmTime(booking.startsAt)} –{" "}
                  {formatAmPmTime(booking.endsAt)}
                  {" · "}
                  {booking.durationMinutes} min
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {staffLabelById?.[booking.id] ??
                    [
                      booking.staffName,
                      ...(booking.additionalStaff?.map((member) => member.name) ??
                        []),
                    ].join(" + ")}
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
