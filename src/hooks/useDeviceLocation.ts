"use client";

import { useCallback, useState } from "react";

import {
  readSavedSearchLocation,
  saveSearchLocation,
  type SavedSearchLocation,
} from "@/lib/search-location-preference";

export type DeviceLocationStatus =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

export type DeviceLocationResult = SavedSearchLocation;

/**
 * Browser geolocation → reverse geocode → localStorage preference.
 */
export function useDeviceLocation() {
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<DeviceLocationResult | null>(() =>
    readSavedSearchLocation(),
  );

  const requestLocation = useCallback(async (): Promise<
    | { ok: true; location: DeviceLocationResult }
    | { ok: false; error: string }
  > => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      const message = "Location is not supported in this browser";
      setStatus("unsupported");
      setError(message);
      return { ok: false, error: message };
    }

    setStatus("locating");
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 12_000,
          maximumAge: 60_000,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const response = await fetch(
        `/api/geo/reverse?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        label?: string;
        lat?: number;
        lng?: number;
        error?: string;
      };

      if (!response.ok || !data.label) {
        throw new Error(data.error || "Could not resolve your suburb");
      }

      const saved = saveSearchLocation({
        label: data.label,
        lat: Number(data.lat ?? lat),
        lng: Number(data.lng ?? lng),
      });

      if (!saved) {
        throw new Error("Could not save your location");
      }

      setLocation(saved);
      setStatus("ready");
      return { ok: true, location: saved };
    } catch (err) {
      const geoErr = err as GeolocationPositionError | Error;
      if (
        typeof GeolocationPositionError !== "undefined" &&
        geoErr instanceof GeolocationPositionError
      ) {
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          const message =
            "Location permission denied. Allow location to search near you.";
          setStatus("denied");
          setError(message);
          return { ok: false, error: message };
        }
        if (geoErr.code === geoErr.TIMEOUT) {
          const message = "Location request timed out. Try again.";
          setStatus("error");
          setError(message);
          return { ok: false, error: message };
        }
      }

      const message =
        geoErr instanceof Error ? geoErr.message : "Could not get your location";
      setStatus("error");
      setError(message);
      return { ok: false, error: message };
    }
  }, []);

  return {
    status,
    error,
    location,
    isLocating: status === "locating",
    requestLocation,
    savedLocation: location,
  };
}
