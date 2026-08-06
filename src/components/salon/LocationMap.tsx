"use client";

import { ExternalLink, MapPin } from "lucide-react";

import { GoogleMap } from "@/components/maps";
import {
  buildDirectionsUrl,
  formatSalonFullAddress,
} from "@/features/salon";
import type { SalonDetail } from "@/types/salon";

type LocationMapProps = {
  salon: SalonDetail;
};

export function LocationMap({ salon }: LocationMapProps) {
  const address = formatSalonFullAddress(salon);
  const directionsUrl = buildDirectionsUrl(salon);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
            Location
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-neutral-500">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            {address}
          </p>
        </div>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.98]"
        >
          Directions
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      <div className="overflow-hidden rounded-3xl border border-neutral-200/80">
        <GoogleMap
          salons={[salon]}
          selectedId={salon.id}
          className="h-[280px] sm:h-[340px]"
        />
      </div>
    </section>
  );
}
