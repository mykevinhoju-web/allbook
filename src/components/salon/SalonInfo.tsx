import {
  Globe,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { formatSalonFullAddress } from "@/features/salon";
import type { SalonDetail } from "@/types/salon";

import { Amenities } from "./Amenities";
import { OpeningHoursList } from "./OpeningHours";

type SalonInfoProps = {
  salon: SalonDetail;
};

export function SalonInfo({ salon }: SalonInfoProps) {
  const address = formatSalonFullAddress(salon);

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
          About
        </h2>
        {salon.description ? (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-neutral-600">
            {salon.description}
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">
            No description available.
          </p>
        )}
      </div>

      {salon.serviceTags.length > 0 ? (
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Services
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {salon.serviceTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Contact
          </h3>
          <ul className="space-y-3 text-sm text-neutral-700">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <span>{address}</span>
            </li>
            {salon.phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-neutral-400" />
                <a href={`tel:${salon.phone}`} className="hover:underline">
                  {salon.phone}
                </a>
              </li>
            ) : null}
            {salon.email ? (
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-neutral-400" />
                <a href={`mailto:${salon.email}`} className="hover:underline">
                  {salon.email}
                </a>
              </li>
            ) : null}
            {salon.website ? (
              <li className="flex items-center gap-2.5">
                <Globe className="size-4 shrink-0 text-neutral-400" />
                <a
                  href={salon.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  Website
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Opening hours
          </h3>
          <OpeningHoursList hours={salon.openingHours} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          Amenities
        </h3>
        <Amenities amenities={salon.amenities} />
      </div>
    </section>
  );
}
