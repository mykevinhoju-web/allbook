"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { useMemo } from "react";

import { getGoogleMapsBrowserKey } from "@/lib/google-maps";
import { cn } from "@/lib/utils";

export type PartnerMapPin = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceLabel?: string;
};

type PartnerResultsMapProps = {
  pins: PartnerMapPin[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * Marketplace result map — partner pins only (no salon Discovery coupling).
 */
export function PartnerResultsMap({
  pins,
  selectedId,
  onSelect,
  className,
}: PartnerResultsMapProps) {
  const apiKey = getGoogleMapsBrowserKey();
  const center = useMemo(() => {
    if (!pins.length) {
      return { lat: -27.355, lng: 153.0 }; // Bridgeman Downs
    }
    const selected = pins.find((p) => p.id === selectedId);
    if (selected) {
      return { lat: selected.latitude, lng: selected.longitude };
    }
    const lat =
      pins.reduce((sum, p) => sum + p.latitude, 0) / Math.max(pins.length, 1);
    const lng =
      pins.reduce((sum, p) => sum + p.longitude, 0) / Math.max(pins.length, 1);
    return { lat, lng };
  }, [pins, selectedId]);

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[360px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-100 text-sm text-stone-500",
          className,
        )}
      >
        Map unavailable (Google Maps key not configured).
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-full min-h-[360px] overflow-hidden rounded-2xl border border-stone-200",
        className,
      )}
    >
      <APIProvider apiKey={apiKey}>
        <Map
          className="h-full w-full"
          defaultCenter={center}
          defaultZoom={14}
          center={center}
          zoom={selectedId ? 15 : 14}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {pins.map((pin) => (
            <Marker
              key={pin.id}
              position={{ lat: pin.latitude, lng: pin.longitude }}
              title={`${pin.name}${pin.priceLabel ? ` · ${pin.priceLabel}` : ""}`}
              onClick={() => onSelect?.(pin.id)}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
