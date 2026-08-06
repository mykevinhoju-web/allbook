"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";

import { MARKETPLACE_CATEGORIES } from "@/features/category";
import type { RegistrationProfile } from "@/features/salon-registration";
import { getGoogleMapsBrowserKey } from "@/lib/google-maps";

import {
  RegisterField,
  registerFieldClass,
  registerPrimaryButtonClass,
  registerSecondaryButtonClass,
} from "./register-ui";

type GoogleRegistrationProps = {
  value: RegistrationProfile;
  onChange: (next: RegistrationProfile) => void;
  onBack: () => void;
  onContinue: () => void;
  error?: string | null;
};

export function GoogleRegistration(props: GoogleRegistrationProps) {
  const apiKey = getGoogleMapsBrowserKey();

  if (!apiKey) {
    return (
      <div className="space-y-4 rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-950">
        <p className="font-semibold">Google Maps is not configured</p>
        <p>
          Add <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          with Places Autocomplete enabled, or register manually instead.
        </p>
        <button
          type="button"
          className={registerSecondaryButtonClass}
          onClick={props.onBack}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <GoogleRegistrationInner {...props} />
    </APIProvider>
  );
}

function GoogleRegistrationInner({
  value,
  onChange,
  onBack,
  onContinue,
  error,
}: GoogleRegistrationProps) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  const [searchReady, setSearchReady] = useState(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: [
        "place_id",
        "name",
        "formatted_address",
        "address_components",
        "geometry",
        "formatted_phone_number",
        "international_phone_number",
        "website",
      ],
      types: ["establishment"],
      componentRestrictions: { country: "au" },
    });

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place) return;

      const current = valueRef.current;
      const components = place.address_components ?? [];
      const get = (type: string) =>
        components.find((c) => c.types.includes(type))?.long_name ?? "";
      const getShort = (type: string) =>
        components.find((c) => c.types.includes(type))?.short_name ?? "";

      const suburb =
        get("locality") ||
        get("sublocality") ||
        get("postal_town") ||
        get("administrative_area_level_2");
      const streetNumber = get("street_number");
      const route = get("route");
      const addressLine =
        [streetNumber, route].filter(Boolean).join(" ") ||
        place.formatted_address?.split(",")[0] ||
        "";

      onChange({
        ...current,
        businessName: place.name || current.businessName,
        address: addressLine || current.address,
        suburb: suburb || current.suburb,
        postcode: get("postal_code") || current.postcode,
        state: getShort("administrative_area_level_1") || current.state || "QLD",
        country: get("country") || current.country || "Australia",
        phone:
          place.formatted_phone_number ||
          place.international_phone_number ||
          current.phone,
        website: place.website || current.website,
        latitude: place.geometry?.location?.lat() ?? current.latitude,
        longitude: place.geometry?.location?.lng() ?? current.longitude,
        googlePlaceId: place.place_id || current.googlePlaceId,
        categorySlug: current.categorySlug || "hair",
      });
      setSearchReady(true);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [places, onChange]);

  function patch(partial: Partial<RegistrationProfile>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Step 2 of 6 · Google
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950 sm:text-4xl">
          Find your salon
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-neutral-600">
          Search Google Places, then review and edit every field before you
          continue.
        </p>
      </header>

      <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <RegisterField
          label="Search Google"
          htmlFor="google-places-search"
          hint="Start typing your salon name — pick the matching business."
        >
          <input
            ref={inputRef}
            id="google-places-search"
            type="text"
            placeholder="e.g. Glow Hair Studio Aspley"
            className={registerFieldClass}
            autoComplete="off"
          />
        </RegisterField>
        {searchReady ? (
          <p className="mt-3 text-[13px] font-medium text-emerald-700">
            Details imported — edit anything below if needed.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <RegisterField label="Business Name" htmlFor="g-name" required className="sm:col-span-2">
          <input
            id="g-name"
            className={registerFieldClass}
            value={value.businessName}
            onChange={(e) => patch({ businessName: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Category" htmlFor="g-category" required className="sm:col-span-2">
          <select
            id="g-category"
            className={registerFieldClass}
            value={value.categorySlug}
            onChange={(e) =>
              patch({
                categorySlug: e.target
                  .value as RegistrationProfile["categorySlug"],
              })
            }
          >
            <option value="">Select category</option>
            {MARKETPLACE_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </RegisterField>
        <RegisterField label="Address" htmlFor="g-address" required className="sm:col-span-2">
          <input
            id="g-address"
            className={registerFieldClass}
            value={value.address}
            onChange={(e) => patch({ address: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Suburb" htmlFor="g-suburb" required>
          <input
            id="g-suburb"
            className={registerFieldClass}
            value={value.suburb}
            onChange={(e) => patch({ suburb: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Postcode" htmlFor="g-postcode" required>
          <input
            id="g-postcode"
            className={registerFieldClass}
            value={value.postcode}
            onChange={(e) => patch({ postcode: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Phone" htmlFor="g-phone">
          <input
            id="g-phone"
            className={registerFieldClass}
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Website" htmlFor="g-website">
          <input
            id="g-website"
            className={registerFieldClass}
            value={value.website}
            onChange={(e) => patch({ website: e.target.value })}
          />
        </RegisterField>
        <RegisterField label="Latitude" htmlFor="g-lat">
          <input
            id="g-lat"
            className={registerFieldClass}
            value={value.latitude ?? ""}
            onChange={(e) =>
              patch({
                latitude: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </RegisterField>
        <RegisterField label="Longitude" htmlFor="g-lng">
          <input
            id="g-lng"
            className={registerFieldClass}
            value={value.longitude ?? ""}
            onChange={(e) =>
              patch({
                longitude:
                  e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </RegisterField>
      </div>

      {error ? (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={registerSecondaryButtonClass} onClick={onBack}>
          Back
        </button>
        <button type="button" className={registerPrimaryButtonClass} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
