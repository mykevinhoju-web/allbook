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
  bellActive: boolean;
  enableAlerts: () => Promise<void>;
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
  const [bellActive, setBellActive] = useState(false);

  useEffect(() => {
    setAlertsEnabled(isBookingAlertsEnabled());
  }, []);

  const handleBooking = useCallback(
    (payload: BookingAlertPayload) => {
      triggerBookingAlert(payload.staffName, audioRef.current);
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
      return;
    }

    setIsListening(true);
    const unsubscribe = subscribeToBookingAlerts(tenant.slug, handleBooking);

    return () => {
      unsubscribe();
      setIsListening(false);
    };
  }, [alertsEnabled, tenant.slug, handleBooking]);

  const enableAlerts = useCallback(async () => {
    try {
      audioRef.current = await unlockBookingAudio();

      if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }

      setBookingAlertsEnabled(true);
      setAlertsEnabled(true);
      playBookingChime(audioRef.current);
      vibrateForBooking();

      toast.success("Booking alerts enabled", {
        description: "Sound, vibration, and live listening are active.",
        position: isMobile ? "top-center" : "top-right",
      });
    } catch {
      toast.error("Could not enable alerts", {
        description: "Please tap again or check browser permissions.",
        position: isMobile ? "top-center" : "top-right",
      });
    }
  }, [isMobile]);

  const value = useMemo(
    () => ({
      alertsEnabled,
      isListening,
      bellActive,
      enableAlerts,
    }),
    [alertsEnabled, isListening, bellActive, enableAlerts],
  );

  return (
    <BookingAlertContext.Provider value={value}>
      {children}
      {!alertsEnabled ? <BookingAlertEnableBanner onEnable={enableAlerts} /> : null}
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
