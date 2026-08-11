"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DetailPayload = {
  partner: {
    id: string;
    displayName: string;
    bio: string | null;
    partnerType: string;
    linkedBusiness: boolean;
    salonId: string | null;
    isDemo?: boolean;
  };
  services: Array<{
    id: string;
    name: string;
    categorySlug: string;
    pricingType: string;
    priceCents: number | null;
    durationMinutes: number | null;
  }>;
  areas: Array<{
    id: string;
    mode: string;
    suburbId: string | null;
    postcodes: string[] | null;
    radiusKm: number | null;
  }>;
  availability: {
    timezone: string;
    weeklyWindows: unknown;
    capacityPerSlot: number;
  } | null;
};

export function MarketplacePartnerDetail({ partnerId }: { partnerId: string }) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(
          `/api/marketplace/partners/public/${partnerId}`,
        );
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Not found.");
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      }
    })();
  }, [partnerId]);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="text-rose-700">{error}</p>
        <Link href="/marketplace" className="mt-4 inline-block text-sm underline">
          Back to search
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-sm text-stone-500">
        Loading partner…
      </div>
    );
  }

  const { partner, services, areas, availability } = data;

  return (
    <div className="min-h-svh bg-stone-50">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
        <Link href="/marketplace" className="text-sm text-stone-600 underline">
          ← Back to search
        </Link>
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-3xl text-stone-900">
              {partner.displayName}
            </h1>
            {partner.isDemo ? (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Sample business
              </span>
            ) : null}
          </div>
          <p className="text-sm text-stone-600">
            {partner.bio || "Marketplace Partner"}
          </p>
          <p className="text-xs text-stone-500">
            Type: {partner.partnerType}
            {partner.linkedBusiness
              ? " · Linked to an AllBook business"
              : " · Independent partner"}
          </p>
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-stone-900">Services & prices</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span>
                  {s.name}
                  <span className="text-stone-400"> · {s.categorySlug}</span>
                </span>
                <span className="font-medium">
                  {s.priceCents != null
                    ? `$${(s.priceCents / 100).toFixed(0)}`
                    : "Quote"}{" "}
                  <span className="text-xs font-normal text-stone-500">
                    {s.pricingType}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-stone-900">Service areas</h2>
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {areas.map((a) => (
              <li key={a.id}>
                {a.mode}
                {a.postcodes?.length ? `: ${a.postcodes.join(", ")}` : ""}
                {a.radiusKm != null ? `: ${a.radiusKm} km radius` : ""}
                {a.mode === "suburb" && a.suburbId
                  ? ` · suburb ${a.suburbId.slice(0, 8)}…`
                  : ""}
              </li>
            ))}
            {!areas.length ? <li>No areas listed.</li> : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium text-stone-900">Availability</h2>
          {availability ? (
            <div className="mt-2 space-y-2 text-sm text-stone-700">
              <p>Timezone: {availability.timezone}</p>
              <p>Capacity / slot: {availability.capacityPerSlot}</p>
              <pre className="overflow-x-auto rounded-lg bg-stone-50 p-3 text-xs">
{JSON.stringify(availability.weeklyWindows, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="mt-2 text-sm text-stone-500">No availability published.</p>
          )}
        </section>

        <p className="text-xs text-stone-400">
          Contact details are hidden on this public page. Booking and messaging
          are not enabled in Phase 1.
        </p>
      </div>
    </div>
  );
}
