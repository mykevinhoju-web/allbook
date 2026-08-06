"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";

import type { MockSalon } from "@/data/mockSalons";
import { useGeocodeLocation } from "@/hooks/useGeocodeLocation";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SELECTED_SALON_ZOOM,
  getGoogleMapsBrowserKey,
  type LatLngLiteral,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";

import { SalonMarker } from "./SalonMarker";

type GoogleMapProps = {
  salons: MockSalon[];
  selectedId?: string | null;
  /** Bumps on intentional focus (card/marker) to retrigger pan + bounce. */
  focusToken?: number;
  /** Suburb from the search toolbar / URL — geocoded when no salon is selected. */
  searchLocation?: string;
  onSelect?: (salonId: string) => void;
  className?: string;
};

type CameraTarget = {
  center: LatLngLiteral;
  zoom: number;
};

function MapCamera({
  target,
  focusToken = 0,
}: {
  target: CameraTarget;
  focusToken?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(target.center);
    // Smooth zoom toward the target
    map.setZoom(target.zoom);
  }, [
    map,
    target.center.lat,
    target.center.lng,
    target.zoom,
    focusToken,
  ]);

  return null;
}

function GoogleMapCanvas({
  salons,
  selectedId,
  focusToken = 0,
  searchLocation = "",
  onSelect,
  className,
}: GoogleMapProps) {
  const selectedSalon = useMemo(
    () => salons.find((s) => s.id === selectedId) ?? null,
    [salons, selectedId],
  );

  const geocode = useGeocodeLocation(
    selectedSalon ? "" : searchLocation,
  );

  const camera = useMemo<CameraTarget>(() => {
    if (selectedSalon) {
      return {
        center: {
          lat: selectedSalon.latitude,
          lng: selectedSalon.longitude,
        },
        zoom: SELECTED_SALON_ZOOM,
      };
    }

    if (searchLocation.trim() && geocode.status === "ready") {
      return { center: geocode.center, zoom: DEFAULT_MAP_ZOOM };
    }

    if (searchLocation.trim() && geocode.status === "loading") {
      return { center: geocode.center, zoom: DEFAULT_MAP_ZOOM };
    }

    return { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM };
  }, [selectedSalon, searchLocation, geocode.center, geocode.status]);

  const statusLabel =
    selectedSalon
      ? `${selectedSalon.name} · ${selectedSalon.suburb}`
      : geocode.status === "loading"
        ? "Finding location…"
        : geocode.status === "error"
          ? "Showing Brisbane"
          : geocode.formattedAddress ||
            (searchLocation.trim()
              ? searchLocation
              : `${salons.length} salon${salons.length === 1 ? "" : "s"}`);

  return (
    <div
      className={cn(
        "relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100",
        className,
      )}
    >
      <Map
        defaultCenter={DEFAULT_MAP_CENTER}
        defaultZoom={DEFAULT_MAP_ZOOM}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <MapCamera target={camera} focusToken={focusToken} />

        {salons.map((salon) => (
          <SalonMarker
            key={salon.id}
            salon={salon}
            selected={selectedId === salon.id}
            bounceToken={selectedId === salon.id ? focusToken : 0}
            onClick={onSelect}
          />
        ))}
      </Map>

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-3.5 py-2 shadow-md backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5CF6]">
          Map
        </p>
        <p className="max-w-[240px] truncate text-xs text-neutral-500">
          {statusLabel}
        </p>
      </div>
    </div>
  );
}

function GoogleMapFallback({
  salons,
  selectedId,
  onSelect,
  className,
}: Pick<GoogleMapProps, "salons" | "selectedId" | "onSelect" | "className">) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-[320px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 text-center",
        className,
      )}
    >
      <p className="text-sm font-semibold text-neutral-800">
        Google Maps key missing
      </p>
      <p className="max-w-sm text-xs text-neutral-500">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the live map.
      </p>
      <ul className="mt-2 space-y-1 text-left text-xs text-neutral-600">
        {salons.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className={cn(
                "underline-offset-2 hover:underline",
                selectedId === s.id && "font-semibold text-[#6B5CF6]",
              )}
              onClick={() => onSelect?.(s.id)}
            >
              {s.name} · {s.suburb}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Production-ready Google Map for marketplace search.
 * Reusable: pass mock (or future API) salons + selection handlers.
 */
export function GoogleMap(props: GoogleMapProps) {
  const apiKey = getGoogleMapsBrowserKey();

  if (!apiKey) {
    return (
      <GoogleMapFallback
        salons={props.salons}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        className={props.className}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
      <GoogleMapCanvas {...props} />
    </APIProvider>
  );
}
