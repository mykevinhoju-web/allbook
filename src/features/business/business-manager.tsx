"use client";

import { ExternalLink, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  BusinessProfileForm,
  toBusinessFormValue,
} from "@/components/business";
import type { BusinessProfile } from "@/features/business";

type BusinessProfileManagerProps = {
  initialBusiness: BusinessProfile;
  allowFeaturedEdit?: boolean;
};

export function BusinessProfileManager({
  initialBusiness,
  allowFeaturedEdit = false,
}: BusinessProfileManagerProps) {
  const [business, setBusiness] = useState(initialBusiness);
  const [form, setForm] = useState(() => toBusinessFormValue(initialBusiness));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, kind: "logo" | "cover") {
    const body = new FormData();
    body.set("file", file);
    body.set("kind", kind);
    body.set("salonId", business.id);

    const res = await fetch("/api/platform/salon/business/upload", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Upload failed.");
    }
    return data.url;
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/salon/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: business.id,
          input: {
            ...form,
            ownerKeywords: form.ownerKeywords ?? [],
            settings: {
              bookingEnabled: form.settings.bookingEnabled,
              acceptNewCustomers: form.settings.acceptNewCustomers,
            },
          },
        }),
      });
      const data = (await res.json()) as {
        business?: BusinessProfile;
        error?: string;
      };
      if (!res.ok || !data.business) {
        throw new Error(data.error || "Could not save changes.");
      }
      setBusiness(data.business);
      setForm(toBusinessFormValue(data.business));
      setMessage("Changes saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">
            Business
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-950">
            Business profile
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Edit the public details for {business.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={business.publicPath}
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 transition hover:border-neutral-300"
          >
            Preview public page
            <ExternalLink className="size-3.5" />
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <BusinessProfileForm
        value={form}
        onChange={setForm}
        onUploadFile={uploadFile}
        ownerKeywordLimit={business.ownerKeywordLimit}
        allowFeaturedEdit={allowFeaturedEdit}
      />

      <div className="flex justify-end gap-2 pb-10">
        <Link
          href={business.publicPath}
          target="_blank"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800"
        >
          Preview public page
          <ExternalLink className="size-3.5" />
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}
