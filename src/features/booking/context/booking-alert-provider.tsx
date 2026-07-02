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
import { useIsMobile } from "@/hooks/use-mobile";
import { useTenant } from "@/features/tenants";
import { subscribeToWebPush, isPushSupported } from "@/features/pwa";

import { BookingAlertEnableBanner } from "../components/booking-alert-enable-banner";
import { subscribeToBookingAlerts } from "../lib/booking-realtime";
import {
  isBookingAlertsEnabled,
  playBookingChime,
  setBookingAlertsEnabled,
  triggerBookingAlert,
  unlockBookingAudio,
  vibrateForBooking,
} from "../lib/booking-alert-sound";
import type { BookingAlertPayload } from "../types/booking-alert";

interface BookingAlertContextValue {
  alertsEnabled: boolean;
  isListening: boolean;
  connectionStatus: string;
  bellActive: boolean;
  enableAlerts: () => Promise<void>;
  testSound: () => Promise<void>;
}

const BookingAlertContext = createContext<BookingAlertContextValue | null>(
  null,
);

export function BookingAlertProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = useTenant();
  const isMobile = useIsMobile();
  const audioRef = useRef<AudioContext | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("IDLE");
  const [bellActive, setBellActive] = useState(false);

  useEffect(() => {
    setAlertsEnabled(isBookingAlertsEnabled());
  }, []);

  const handleBooking = useCallback(
    (payload: BookingAlertPayload) => {
      void triggerBookingAlert(payload.staffName);
      setBellActive(true);
      window.setTimeout(() => setBellActive(false), 2500);

      toast.success("New booking request", {
        description: `${payload.staffName} — customer tapped Book`,
        position: isMobile ? "top-center" : "top-right",
        duration: 6000,
      });
    },
    [isMobile],
  );

  useEffect(() => {
    if (!alertsEnabled) {
      setIsListening(false);
      setConnectionStatus("IDLE");
      return;
    }

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
  }, [alertsEnabled, tenant.slug, handleBooking]);

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

  const value = useMemo(
    () => ({
      alertsEnabled,
      isListening,
      connectionStatus,
      bellActive,
      enableAlerts,
      testSound,
    }),
    [
      alertsEnabled,
      isListening,
      connectionStatus,
      bellActive,
      enableAlerts,
      testSound,
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
