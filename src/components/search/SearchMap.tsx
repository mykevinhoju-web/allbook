"use client";

import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import { useGeocodeLocation } from "@/hooks/useGeocodeLocation";
import {
  DEFAULT_MAP_ZOOM,
  SEARCH_MAP_ZOOM,
  getGoogleMapsBrowserKey,
} from "@/lib/google-maps";
import { cn } from "@/lib/utils";

import { MapPlaceholder } from "./MapPlaceholder";
import type { Salon } from "./types";

type SearchMapProps = {
  location: string;
  salons: Salon[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

function MapCamera({
  center,
  zoom,
}: {
  center: google.maps.LatLngLiteral;
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);

  return null;
}

function SearchMapInner({
  location,
  salons,
  selectedId,
  onSelect,
  className,
}: SearchMapProps) {
  const { center, status, formattedAddress } = useGeocodeLocation(location);
  const zoom = location.trim() ? SEARCH_MAP_ZOOM : DEFAULT_MAP_ZOOM;

  return (
    <div
      className={cn(
        "relative h-full min-h-[320px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-100",
        className,
      )}
    >
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        className="h-full w-full"
        style={{ width: "100%", height: "100%" }}
      >
        <MapCamera center={center} zoom={zoom} />

        {salons.map((salon) => (
          <Marker
            key={salon.id}
            position={{ lat: salon.lat, lng: salon.lng }}
            title={`${salon.name} · from $${salon.startingPrice}`}
            onClick={() => onSelect?.(salon.id)}
            // Highlight selected salon with a slight z-index bump via optimized flag
            zIndex={selectedId === salon.id ? 999 : 1}
          />
        ))}
      </Map>

      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-xl bg-white/95 px-3.5 py-2 shadow-md backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B5CF6]">
          Map
        </p>
        <p className="max-w-[220px] truncate text-xs text-neutral-500">
          {status === "loading"
            ? "Finding location…"
            : status === "error"
              ? "Could not geocode — showing Brisbane"
              : formattedAddress ||
                (location.trim()
                  ? location
                  : `${salons.length} mock salon${salons.length === 1 ? "" : "s"}`)}
        </p>
      </div>

      {selectedId ? (
        <div className="absolute bottom-4 left-4 right-4 z-10 sm:left-auto sm:right-4 sm:w-64">
          {(() => {
            const salon = salons.find((s) => s.id === selectedId);
            if (!salon) return null;
            return (
              <div className="rounded-xl border border-neutral-200/80 bg-white/95 px-3.5 py-3 shadow-lg backdrop-blur">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {salon.name}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  From ${salon.startingPrice} · {salon.distanceKm.toFixed(1)} km
                </p>
              </div>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Google Map for /search. Falls back to the decorative placeholder when the
 * browser API key is missing.
 */
export function SearchMap(props: SearchMapProps) {
  const apiKey = getGoogleMapsBrowserKey();

  if (!apiKey) {
    return (
      <MapPlaceholder
        salons={props.salons}
        selectedId={props.selectedId}
        onSelect={props.onSelect}
        className={props.className}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
      <SearchMapInner {...props} />
    </APIProvider>
  );
}
