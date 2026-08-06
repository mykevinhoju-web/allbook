"use client";

import { Marker, useMarkerRef } from "@vis.gl/react-google-maps";
import { useEffect } from "react";

import type { Salon } from "@/types/salon";

type SalonMarkerProps = {
  salon: Salon;
  selected?: boolean;
  /** Incremented when the user focuses this salon — retriggers bounce. */
  bounceToken?: number;
  onClick?: (salonId: string) => void;
};

/**
 * Reusable Google Maps marker for a salon.
 * Selected markers bounce briefly and sit above siblings.
 */
export function SalonMarker({
  salon,
  selected = false,
  bounceToken = 0,
  onClick,
}: SalonMarkerProps) {
  const [markerRef, marker] = useMarkerRef();

  useEffect(() => {
    if (!marker || typeof google === "undefined") return;

    if (!selected) {
      marker.setAnimation(null);
      return;
    }

    marker.setAnimation(google.maps.Animation.BOUNCE);
    const timer = window.setTimeout(() => {
      marker.setAnimation(null);
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      marker.setAnimation(null);
    };
  }, [marker, selected, bounceToken]);

  return (
    <Marker
      ref={markerRef}
      position={{ lat: salon.latitude, lng: salon.longitude }}
      title={`${salon.name} · ${salon.suburb} · from $${salon.price}`}
      onClick={() => onClick?.(salon.id)}
      zIndex={selected ? 1000 : 1}
    />
  );
}
