"use client";

import { GoogleMap } from "@/components/maps";
import type { BusinessProfile } from "@/features/business";
import type { Salon } from "@/types/salon";

type BusinessLocationProps = {
  address: string;
  suburb: string;
  latitude: number;
  longitude: number;
  onChange: (
    next: Partial<
      Pick<BusinessProfile, "address" | "suburb" | "latitude" | "longitude">
    >,
  ) => void;
};

function toMapSalon(
  address: string,
  suburb: string,
  latitude: number,
  longitude: number,
): Salon {
  return {
    id: "preview",
    name: "Location preview",
    description: null,
    phone: null,
    email: null,
    website: null,
    coverImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=60",
    logo: null,
    address,
    suburb: suburb || "Brisbane",
    city: "Brisbane",
    state: "QLD",
    postcode: null,
    country: "Australia",
    latitude,
    longitude,
    rating: 0,
    reviewCount: 0,
    verified: false,
    service: "Hair",
    price: 0,
    slug: "preview",
  };
}

export function BusinessLocation({
  address,
  suburb,
  latitude,
  longitude,
  onChange,
}: BusinessLocationProps) {
  const mapSalon = toMapSalon(address, suburb, latitude, longitude);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            Address
          </span>
          <input
            value={address}
            onChange={(e) => onChange({ address: e.target.value })}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
            Suburb
          </span>
          <input
            value={suburb}
            onChange={(e) => onChange({ suburb: e.target.value })}
            className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
              Latitude
            </span>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) =>
                onChange({ latitude: Number(e.target.value) || 0 })
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-neutral-500">
              Longitude
            </span>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) =>
                onChange({ longitude: Number(e.target.value) || 0 })
              }
              className="h-11 w-full rounded-2xl border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-400"
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200">
        <GoogleMap
          salons={[mapSalon]}
          selectedId="preview"
          className="h-[240px]"
        />
      </div>
    </div>
  );
}
