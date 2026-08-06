import { SALON_AMENITIES } from "@/features/salon";
import type { AmenityId } from "@/types/salon";
import {
  Accessibility,
  Car,
  Coffee,
  Wifi,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<AmenityId, LucideIcon> = {
  wifi: Wifi,
  parking: Car,
  wheelchair: Accessibility,
  coffee: Coffee,
  air_conditioning: Wind,
};

type AmenitiesProps = {
  amenities: AmenityId[];
};

export function Amenities({ amenities }: AmenitiesProps) {
  const items = SALON_AMENITIES.filter((item) => amenities.includes(item.id));

  if (items.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No amenities listed.</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = ICONS[item.id];
        return (
          <li
            key={item.id}
            className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 px-3.5 py-3 text-sm font-medium text-neutral-800"
          >
            <Icon className="size-4 shrink-0 text-neutral-500" />
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
