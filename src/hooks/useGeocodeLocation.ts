"use client";

import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";

import {
  DEFAULT_MAP_CENTER,
  buildGeocodeAddress,
  type LatLngLiteral,
} from "@/lib/google-maps";

type GeocodeState = {
  center: LatLngLiteral;
  status: "idle" | "loading" | "ready" | "error";
  formattedAddress?: string;
};

/**
 * Geocode a suburb / location string via the Maps JS Geocoding library.
 * Keeps map center in sync with Search Toolbar / URL `location` param.
 */
export function useGeocodeLocation(location: string): GeocodeState {
  const geocoding = useMapsLibrary("geocoding");
  const [state, setState] = useState<GeocodeState>({
    center: DEFAULT_MAP_CENTER,
    status: location.trim() ? "loading" : "idle",
  });

  useEffect(() => {
    const query = location.trim();
    if (!query) {
      setState({ center: DEFAULT_MAP_CENTER, status: "idle" });
      return;
    }

    if (!geocoding) {
      setState((prev) => ({ ...prev, status: "loading" }));
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    const geocoder = new geocoding.Geocoder();
    void geocoder.geocode(
      {
        address: buildGeocodeAddress(query),
        componentRestrictions: { country: "AU" },
      },
      (results, status) => {
        if (cancelled) return;

        if (status === "OK" && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          setState({
            center: { lat: loc.lat(), lng: loc.lng() },
            status: "ready",
            formattedAddress: results[0].formatted_address,
          });
          return;
        }

        setState({
          center: DEFAULT_MAP_CENTER,
          status: "error",
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [geocoding, location]);

  return state;
}
