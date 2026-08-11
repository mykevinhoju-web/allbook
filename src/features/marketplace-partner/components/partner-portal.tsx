"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  MarketplacePartner,
  PartnerAvailabilityRule,
  PartnerPricingType,
  PartnerService,
  PartnerServiceArea,
  PartnerType,
} from "@/features/marketplace-partner";

type OwnedSalon = { id: string; name: string };

const PRICING: PartnerPricingType[] = ["fixed", "hourly", "from", "quote"];

/**
 * Phase 1 Partner portal: apply, profile, services, areas, availability.
 * No AI matching / booking UI.
 */
export function PartnerPortal({
  initialPartner,
  ownedSalons,
}: {
  initialPartner: MarketplacePartner | null;
  ownedSalons: OwnedSalon[];
}) {
  const [partner, setPartner] = useState(initialPartner);
  const [services, setServices] = useState<PartnerService[]>([]);
  const [areas, setAreas] = useState<PartnerServiceArea[]>([]);
  const [availability, setAvailability] =
    useState<PartnerAvailabilityRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [applyType, setApplyType] = useState<PartnerType>(
    ownedSalons[0] ? "business_linked" : "independent",
  );
  const [displayName, setDisplayName] = useState("");
  const [salonId, setSalonId] = useState(ownedSalons[0]?.id ?? "");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [svcName, setSvcName] = useState("");
  const [svcCategory, setSvcCategory] = useState("lawn_care");
  const [svcPricing, setSvcPricing] = useState<PartnerPricingType>("fixed");
  const [svcPrice, setSvcPrice] = useState("80");
  const [svcDuration, setSvcDuration] = useState("60");

  const [areaMode, setAreaMode] = useState<"postcodes" | "radius">("postcodes");
  const [postcodes, setPostcodes] = useState("4034");
  const [radiusKm, setRadiusKm] = useState("10");
  const [centerLat, setCenterLat] = useState("-27.38");
  const [centerLng, setCenterLng] = useState("153.01");

  const [weeklyJson, setWeeklyJson] = useState(
    '[{"day":1,"start":"08:00","end":"17:00"},{"day":2,"start":"08:00","end":"17:00"}]',
  );

  const loadExtras = useCallback(async (partnerId: string) => {
    const [sRes, aRes, vRes] = await Promise.all([
      fetch(`/api/marketplace/partners/${partnerId}/services`),
      fetch(`/api/marketplace/partners/${partnerId}/areas`),
      fetch(`/api/marketplace/partners/${partnerId}/availability`),
    ]);
    const sJson = await sRes.json();
    const aJson = await aRes.json();
    const vJson = await vRes.json();
    if (sRes.ok) setServices(sJson.services ?? []);
    if (aRes.ok) setAreas(aJson.areas ?? []);
    if (vRes.ok) setAvailability(vJson.availability ?? null);
  }, []);

  useEffect(() => {
    if (partner?.id) {
      void loadExtras(partner.id);
      setDisplayName(partner.displayName);
      setBio(partner.bio ?? "");
      setPhone(partner.phone ?? "");
      setEmail(partner.email ?? "");
    }
  }, [partner?.id, loadExtras]);

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/marketplace/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerType: applyType,
          salonId: applyType === "business_linked" ? salonId : null,
          displayName,
          bio,
          phone,
          email,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Apply failed.");
      setPartner(data.partner);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile() {
    if (!partner) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/marketplace/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, phone, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed.");
      setPartner(data.partner);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addService() {
    if (!partner) return;
    setBusy(true);
    setError(null);
    try {
      const priceCents =
        svcPricing === "quote" ? null : Math.round(Number(svcPrice) * 100);
      const response = await fetch(
        `/api/marketplace/partners/${partner.id}/services`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categorySlug: svcCategory,
            name: svcName,
            pricingType: svcPricing,
            priceCents,
            durationMinutes: Number(svcDuration) || null,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add service.");
      setServices((prev) => [...prev, data.service]);
      setSvcName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add service.");
    } finally {
      setBusy(false);
    }
  }

  async function removeService(serviceId: string) {
    if (!partner) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/marketplace/partners/${partner.id}/services/${serviceId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Delete failed.");
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addArea() {
    if (!partner) return;
    setBusy(true);
    setError(null);
    try {
      const body =
        areaMode === "postcodes"
          ? {
              mode: "postcodes" as const,
              postcodes: postcodes
                .split(/[,\s]+/)
                .map((p) => p.trim())
                .filter(Boolean),
            }
          : {
              mode: "radius" as const,
              centerLat: Number(centerLat),
              centerLng: Number(centerLng),
              radiusKm: Number(radiusKm),
            };
      const response = await fetch(
        `/api/marketplace/partners/${partner.id}/areas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not add area.");
      setAreas((prev) => [...prev, data.area]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add area.");
    } finally {
      setBusy(false);
    }
  }

  async function removeArea(areaId: string) {
    if (!partner) return;
    setBusy(true);
    try {
      const response = await fetch(
        `/api/marketplace/partners/${partner.id}/areas/${areaId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed.");
      }
      setAreas((prev) => prev.filter((a) => a.id !== areaId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAvailability() {
    if (!partner) return;
    setBusy(true);
    setError(null);
    try {
      const weeklyWindows = JSON.parse(weeklyJson) as unknown;
      const response = await fetch(
        `/api/marketplace/partners/${partner.id}/availability`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timezone: "Australia/Brisbane",
            weeklyWindows,
            blackouts: [],
            capacityPerSlot: 1,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed.");
      setAvailability(data.availability);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!partner) {
    return (
      <div className="mx-auto max-w-xl space-y-6 p-4 md:p-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Become an AllBook Partner
          </h1>
          <p className="text-sm text-stone-600">
            Register services and pricing you set yourself. Google data is never
            used to invent your prices.
          </p>
        </header>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
          <label className="block text-sm font-medium text-stone-800">
            Partner type
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={applyType}
              onChange={(e) => setApplyType(e.target.value as PartnerType)}
            >
              <option value="independent">Independent provider</option>
              <option value="business_linked" disabled={!ownedSalons.length}>
                Existing claimed business
              </option>
            </select>
          </label>
          {applyType === "business_linked" ? (
            <label className="block text-sm font-medium text-stone-800">
              Business
              <select
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
                value={salonId}
                onChange={(e) => setSalonId(e.target.value)}
              >
                {ownedSalons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-sm font-medium text-stone-800">
            Display name
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Bio
            <textarea
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Phone
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !displayName.trim()}
            onClick={() => void apply()}
            className="w-full rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            Submit application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Partner portal</h1>
        <p className="text-sm text-stone-600">
          Status: <span className="font-medium">{partner.status}</span> ·{" "}
          {partner.partnerType}
          {partner.status !== "active"
            ? " — not publicly active until platform admin approves."
            : null}
        </p>
      </header>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Profile</h2>
        <input
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
        />
        <textarea
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
          />
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveProfile()}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Save profile
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Services & pricing</h2>
        <p className="text-xs text-stone-500">
          Enter prices yourself. AllBook will never invent prices from Google or
          AI.
        </p>
        <ul className="space-y-2 text-sm">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 px-3 py-2"
            >
              <span>
                {s.name} · {s.categorySlug} · {s.pricingType}
                {s.priceCents != null
                  ? ` · $${(s.priceCents / 100).toFixed(0)}`
                  : " · quote"}
              </span>
              <button
                type="button"
                className="text-rose-700"
                onClick={() => void removeService(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            placeholder="Service name"
            value={svcName}
            onChange={(e) => setSvcName(e.target.value)}
          />
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            placeholder="category_slug"
            value={svcCategory}
            onChange={(e) => setSvcCategory(e.target.value)}
          />
          <select
            className="rounded-lg border border-stone-300 px-3 py-2"
            value={svcPricing}
            onChange={(e) =>
              setSvcPricing(e.target.value as PartnerPricingType)
            }
          >
            {PRICING.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            placeholder="Price AUD"
            value={svcPrice}
            onChange={(e) => setSvcPrice(e.target.value)}
            disabled={svcPricing === "quote"}
          />
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            placeholder="Duration minutes"
            value={svcDuration}
            onChange={(e) => setSvcDuration(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={busy || !svcName.trim()}
          onClick={() => void addService()}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Add service
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Service areas</h2>
        <ul className="space-y-2 text-sm">
          {areas.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-100 px-3 py-2"
            >
              <span>
                {a.mode}
                {a.postcodes?.length
                  ? `: ${a.postcodes.join(", ")}`
                  : a.radiusKm
                    ? `: ${a.radiusKm}km`
                    : ""}
              </span>
              <button
                type="button"
                className="text-rose-700"
                onClick={() => void removeArea(a.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <select
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          value={areaMode}
          onChange={(e) =>
            setAreaMode(e.target.value as "postcodes" | "radius")
          }
        >
          <option value="postcodes">Postcodes</option>
          <option value="radius">Radius</option>
        </select>
        {areaMode === "postcodes" ? (
          <input
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
            value={postcodes}
            onChange={(e) => setPostcodes(e.target.value)}
            placeholder="4034, 4053"
          />
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              value={centerLat}
              onChange={(e) => setCenterLat(e.target.value)}
              placeholder="lat"
            />
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              value={centerLng}
              onChange={(e) => setCenterLng(e.target.value)}
              placeholder="lng"
            />
            <input
              className="rounded-lg border border-stone-300 px-3 py-2"
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              placeholder="km"
            />
          </div>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void addArea()}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Add area
        </button>
      </section>

      <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-medium">Availability</h2>
        <p className="text-xs text-stone-500">
          Simple weekly windows JSON for Phase 1 (not a booking engine).
        </p>
        {availability ? (
          <p className="text-xs text-stone-500">
            Saved · tz {availability.timezone} · capacity{" "}
            {availability.capacityPerSlot}
          </p>
        ) : null}
        <textarea
          className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-xs"
          rows={4}
          value={weeklyJson}
          onChange={(e) => setWeeklyJson(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveAvailability()}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Save availability
        </button>
      </section>
    </div>
  );
}
