"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { toast } from "@/components/common";
import { fetchAdminApi } from "@/features/admin/lib/admin-api-client";
import {
  readNewBookingsSeenAt,
  writeNewBookingsSeenAt,
} from "@/features/admin/lib/new-bookings-seen";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTenant } from "@/features/tenants";
import { subscribeToWebPush, isPushSupported } from "@/features/pwa";

import { BookingAlertEnableBanner } from "../components/booking-alert-enable-banner";
import { subscribeToBookingAlerts } from "../lib/booking-realtime";
import {
  isBookingAlertsEnabled,
  playBookingChime,
  playServiceEndAlarm,
  setBookingAlertsEnabled,
  triggerBookingAlert,
  unlockBookingAudio,
  vibrateForBooking,
} from "../lib/booking-alert-sound";
import type { BookingAlertPayload } from "../types/booking-alert";
import type { ServiceEndAlertPayload } from "../types/service-end-alert";

interface BookingAlertContextValue {
  alertsEnabled: boolean;
  isListening: boolean;
  connectionStatus: string;
  bellActive: boolean;
  /** Unread new bookings since last visit to Bookings. */
  newBookingCount: number;
  enableAlerts: () => Promise<void>;
  testSound: () => Promise<void>;
  notifyBooking: (staffName: string) => void;
  markNewBookingsSeen: () => void;
  /** While true (e.g. on Bookings page), new alerts do not bump the badge. */
  setNewBookingBadgeSuppressed: (suppressed: boolean) => void;
}

const BookingAlertContext = createContext<BookingAlertContextValue | null>(
  null,
);

export function BookingAlertProvider({
  children,
  filterStaffId = null,
}: {
  children: React.ReactNode;
  filterStaffId?: string | null;
}) {
  const tenant = useTenant();
  const isMobile = useIsMobile();
  const audioRef = useRef<AudioContext | null>(null);
  const lastAlertRef = useRef<{ staffName: string; at: number } | null>(null);
  const suppressBadgeRef = useRef(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("IDLE");
  const [bellActive, setBellActive] = useState(false);
  const [newBookingCount, setNewBookingCount] = useState(0);

  useEffect(() => {
    setAlertsEnabled(isBookingAlertsEnabled());
  }, []);

  const markNewBookingsSeen = useCallback(() => {
    writeNewBookingsSeenAt(tenant.slug);
    setNewBookingCount(0);
  }, [tenant.slug]);

  const setNewBookingBadgeSuppressed = useCallback(
    (suppressed: boolean) => {
      suppressBadgeRef.current = suppressed;
      if (suppressed) {
        markNewBookingsSeen();
      }
    },
    [markNewBookingsSeen],
  );

  useEffect(() => {
    if (filterStaffId) return;

    let cancelled = false;

    const refreshCount = async () => {
      if (suppressBadgeRef.current) return;
      const existing = readNewBookingsSeenAt(tenant.slug);
      if (!existing) {
        writeNewBookingsSeenAt(tenant.slug);
        return;
      }

      try {
        const response = await fetchAdminApi(
          `/api/admin/bookings/new-count?since=${encodeURIComponent(existing)}`,
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { count?: number };
        if (!cancelled && typeof data.count === "number") {
          setNewBookingCount(Math.max(0, data.count));
        }
      } catch {
        // Badge is best-effort; realtime still increments while listening.
      }
    };

    void refreshCount();
    const intervalId = window.setInterval(refreshCount, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshCount();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tenant.slug, filterStaffId]);

  const handleServiceEnd = useCallback(
    (payload: ServiceEndAlertPayload) => {
      const now = Date.now();
      const last = lastAlertRef.current;
      const key = `end:${payload.bookingId}`;
      if (last && last.staffName === key && now - last.at < 8000) {
        return;
      }
      lastAlertRef.current = { staffName: key, at: now };

      if (alertsEnabled) {
        void playServiceEndAlarm(3);
      }
      setBellActive(true);
      window.setTimeout(() => setBellActive(false), 4000);

      toast.error("Service time ended", {
        description: `${payload.roomName} · ${payload.staffName}`,
        position: isMobile ? "top-center" : "top-right",
        duration: 10_000,
      });
    },
    [alertsEnabled, isMobile],
  );

  const handleBooking = useCallback(
    (payload: BookingAlertPayload) => {
      if (filterStaffId && payload.staffId !== filterStaffId) {
        return;
      }

      const now = Date.now();
      const last = lastAlertRef.current;
      if (
        last &&
        last.staffName === payload.staffName &&
        now - last.at < 3000
      ) {
        return;
      }
      lastAlertRef.current = { staffName: payload.staffName, at: now };

      // Toast on every admin page; sound/vibrate only after "Turn on alerts".
      if (alertsEnabled) {
        void triggerBookingAlert(payload.staffName);
      }
      setBellActive(true);
      window.setTimeout(() => setBellActive(false), 2500);

      if (suppressBadgeRef.current) {
        writeNewBookingsSeenAt(tenant.slug);
      } else if (!filterStaffId) {
        setNewBookingCount((count) => count + 1);
      }

      toast.success(filterStaffId ? "New booking for you" : "New booking", {
        description: payload.staffName,
        position: isMobile ? "top-center" : "top-right",
        duration: 6000,
      });
    },
    [alertsEnabled, filterStaffId, isMobile, tenant.slug],
  );

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      unsubscribe?.();
      unsubscribe = subscribeToBookingAlerts(
        tenant.slug,
        handleBooking,
        (status) => {
          setConnectionStatus(status);
          setIsListening(status === "SUBSCRIBED");

          if (
            !cancelled &&
            (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          ) {
            retryTimer = setTimeout(connect, 3000);
          }
        },
        handleServiceEnd,
      );
    };

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe?.();
      setIsListening(false);
      setConnectionStatus("CLOSED");
    };
  }, [tenant.slug, handleBooking, handleServiceEnd]);

  const enableAlerts = useCallback(async () => {
    try {
      audioRef.current = await unlockBookingAudio();

      if (isPushSupported()) {
        await subscribeToWebPush(tenant.slug);
      } else if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        await Notification.requestPermission();
      }

      setBookingAlertsEnabled(true);
      setAlertsEnabled(true);
      await playBookingChime();
      vibrateForBooking();

      toast.success("Booking alerts enabled", {
        description: isPushSupported()
          ? "Push is on — background alerts use your phone notification sound."
          : "You will hear a short chime when this page is open.",
        position: isMobile ? "top-center" : "top-right",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not enable alerts";

      toast.error("Could not enable alerts", {
        description: message,
        position: isMobile ? "top-center" : "top-right",
      });
    }
  }, [isMobile, tenant.slug]);

  const testSound = useCallback(async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = await unlockBookingAudio();
      }
      await playBookingChime();
      vibrateForBooking();
    } catch {
      toast.error("Sound blocked", {
        description: "Check silent mode and tap Test sound again.",
        position: isMobile ? "top-center" : "top-right",
      });
    }
  }, [isMobile]);

  const notifyBooking = useCallback(
    (staffName: string) => {
      handleBooking({
        staffId: "",
        staffName,
        requestedAt: new Date().toISOString(),
      });
    },
    [handleBooking],
  );

  const value = useMemo(
    () => ({
      alertsEnabled,
      isListening,
      connectionStatus,
      bellActive,
      newBookingCount,
      enableAlerts,
      testSound,
      notifyBooking,
      markNewBookingsSeen,
      setNewBookingBadgeSuppressed,
    }),
    [
      alertsEnabled,
      isListening,
      connectionStatus,
      bellActive,
      newBookingCount,
      enableAlerts,
      testSound,
      notifyBooking,
      markNewBookingsSeen,
      setNewBookingBadgeSuppressed,
    ],
  );

  return (
    <BookingAlertContext.Provider value={value}>
      {children}
      {!alertsEnabled ? (
        <BookingAlertEnableBanner onEnable={enableAlerts} />
      ) : null}
    </BookingAlertContext.Provider>
  );
}

export function useBookingAlerts() {
  const context = useContext(BookingAlertContext);

  if (!context) {
    throw new Error("useBookingAlerts must be used within BookingAlertProvider.");
  }

  return context;
}
