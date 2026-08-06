import { Globe, Phone } from "lucide-react";

import type { SalonDetail } from "@/types/salon";

import { OpeningHoursList } from "./OpeningHours";

type AboutSectionProps = {
  salon: SalonDetail;
};

/** About: description, phone, website, business hours */
export function AboutSection({ salon }: AboutSectionProps) {
  return (
    <section className="space-y-8" id="about">
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-3xl border border-neutral-200/80 bg-white p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Contact
          </h3>
          <ul className="space-y-3 text-sm text-neutral-700">
            {salon.phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-neutral-400" />
                <a href={`tel:${salon.phone}`} className="hover:underline">
                  {salon.phone}
                </a>
              </li>
            ) : (
              <li className="text-neutral-400">Phone not listed</li>
            )}
            {salon.website ? (
              <li className="flex items-center gap-2.5">
                <Globe className="size-4 shrink-0 text-neutral-400" />
                <a
                  href={salon.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:underline"
                >
                  {salon.website.replace(/^https?:\/\//, "")}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-3xl border border-neutral-200/80 bg-white p-5">
          <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Business hours
          </h3>
          <OpeningHoursList hours={salon.openingHours} />
        </div>
      </div>
    </section>
  );
}
