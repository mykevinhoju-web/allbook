"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useMemo } from "react";

import type { Salon } from "@/types/salon";
import { useGeocodeLocation } from "@/hooks/useGeocodeLocation";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  SELECTED_SALON_ZOOM,
  SUBURB_SEARCH_ZOOM,
  boundsForSalonMarkers,
  getGoogleMapsBrowserKey,
  type LatLngBoundsLiteral,
  type LatLngLiteral,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";

import { SalonMarker } from "./SalonMarker";

type GoogleMapProps = {
  salons: Salon[];
  selectedId?: string | null;
  /** Bumps on intentional focus (card/marker) to retrigger pan + bounce. */
  focusToken?: number;
  /** Suburb from the search toolbar / URL — geocoded when no salon is selected. */
  searchLocation?: string;
  /** Resolved search origin from the marketplace search engine (preferred). */
  searchOrigin?: LatLngLiteral | null;
  /** Distance filter label only — does not widen the map to the full circle. */
  radiusKm?: number | null;
  onSelect?: (salonId: string) => void;
  className?: string;
};

type CameraTarget = {
  center: LatLngLiteral;
  zoom: number;
  bounds?: LatLngBoundsLiteral | null;
  /** Clamp fitBounds so we never end up city-wide again. */
  maxZoom?: number;
  minZoom?: number;
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

    if (target.bounds) {
      map.fitBounds(target.bounds, 64);
      // fitBounds is async in practice — clamp on the next tick.
      const timer = window.setTimeout(() => {
        const zoom = map.getZoom();
        if (zoom == null) return;
        if (target.maxZoom != null && zoom > target.maxZoom) {
          map.setZoom(target.maxZoom);
        }
        if (target.minZoom != null && zoom < target.minZoom) {
          map.setZoom(target.minZoom);
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }

    map.panTo(target.center);
    map.setZoom(target.zoom);
  }, [
    map,
    target.center.lat,
    target.center.lng,
    target.zoom,
    target.bounds?.north,
    target.bounds?.south,
    target.bounds?.east,
    target.bounds?.west,
    target.maxZoom,
    target.minZoom,
    focusToken,
  ]);

  return null;
}

function GoogleMapCanvas({
  salons,
  selectedId,
  focusToken = 0,
  searchLocation = "",
  searchOrigin = null,
  radiusKm = null,
  onSelect,
  className,
}: GoogleMapProps) {
  const selectedSalon = useMemo(
    () => salons.find((s) => s.id === selectedId) ?? null,
    [salons, selectedId],
  );

  const needsClientGeocode =
    !selectedSalon && !searchOrigin && Boolean(searchLocation.trim());
  const geocode = useGeocodeLocation(
    needsClientGeocode ? searchLocation : "",
  );

  const originCenter = useMemo<LatLngLiteral | null>(() => {
    if (searchOrigin) return searchOrigin;
    if (needsClientGeocode && geocode.status === "ready") {
      return geocode.center;
    }
    if (needsClientGeocode && geocode.status === "loading") {
      return geocode.center;
    }
    return null;
  }, [
    searchOrigin,
    needsClientGeocode,
    geocode.status,
    geocode.center,
  ]);

  const activeRadiusKm =
    typeof radiusKm === "number" && Number.isFinite(radiusKm) && radiusKm > 0
      ? radiusKm
      : null;

  const markerBounds = useMemo(
    () => (!selectedSalon ? boundsForSalonMarkers(salons) : null),
    [salons, selectedSalon],
  );

  const camera = useMemo<CameraTarget>(() => {
    if (selectedSalon) {
      return {
        center: {
          lat: selectedSalon.latitude,
          lng: selectedSalon.longitude,
        },
        zoom: SELECTED_SALON_ZOOM,
        bounds: null,
      };
    }

    // Prefer the result cluster — not the full distance filter (20 km ≈ Brisbane).
    if (markerBounds) {
      const center = {
        lat: (markerBounds.north + markerBounds.south) / 2,
        lng: (markerBounds.east + markerBounds.west) / 2,
      };
      return {
        center,
        zoom: SUBURB_SEARCH_ZOOM,
        bounds: markerBounds,
        maxZoom: 14,
        minZoom: 12,
      };
    }

    if (originCenter) {
      return {
        center: originCenter,
        zoom: SUBURB_SEARCH_ZOOM,
        bounds: null,
      };
    }

    return { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM, bounds: null };
  }, [selectedSalon, markerBounds, originCenter]);

  const statusLabel =
    selectedSalon
      ? `${selectedSalon.name} · ${selectedSalon.suburb}`
      : needsClientGeocode && geocode.status === "loading"
        ? "Finding location…"
        : needsClientGeocode && geocode.status === "error"
          ? "Showing Brisbane"
          : activeRadiusKm != null && searchLocation.trim()
            ? `${searchLocation.trim()} · within ${activeRadiusKm} km`
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
 * Marketplace search map — zooms to result markers (suburb cluster),
 * not the full distance-filter circle.
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
