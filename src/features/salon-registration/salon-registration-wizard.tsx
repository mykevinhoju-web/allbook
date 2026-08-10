"use client";

import Link from "next/link";
import { useState } from "react";

import {
  BusinessDetails,
  GoogleRegistration,
  ManualRegistration,
  OwnerAccount,
  PreviewSalon,
  RegistrationMethod,
  RegistrationSuccess,
} from "@/components/register";
import { AllBookMark } from "@/features/platform-landing/components";
import {
  createEmptyRegistrationDraft,
  validateOwner,
  validateProfile,
  type CatalogueMatch,
  type CreateSalonRegistrationResult,
  type RegistrationMethod as Method,
  type SalonRegistrationDraft,
} from "@/features/salon-registration";
import { cn } from "@/lib/utils";

type WizardStep =
  | "method"
  | "profile"
  | "details"
  | "owner"
  | "preview"
  | "success";

const STEP_PROGRESS: Record<Exclude<WizardStep, "success">, number> = {
  method: 1,
  profile: 2,
  details: 3,
  owner: 4,
  preview: 5,
};

export function SalonRegistrationWizard() {
  const [draft, setDraft] = useState<SalonRegistrationDraft>(
    createEmptyRegistrationDraft,
  );
  const [step, setStep] = useState<WizardStep>("method");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateSalonRegistrationResult | null>(
    null,
  );

  function selectMethod(method: Exclude<Method, "admin">) {
    setDraft((prev) => ({ ...prev, method }));
    setError(null);
    setStep("profile");
  }

  function claimCatalogueMatch(match: CatalogueMatch) {
    setDraft((prev) => ({
      ...prev,
      method: "google",
      profile: {
        ...prev.profile,
        businessName: match.name,
        address: match.address ?? prev.profile.address,
        suburb: match.suburb ?? prev.profile.suburb,
        phone: match.phone ?? prev.profile.phone,
        googlePlaceId: match.googlePlaceId,
        categorySlug: prev.profile.categorySlug || "hair",
      },
    }));
    setError(null);
    setStep("profile");
  }

  function continueFromProfile() {
    const message = validateProfile(draft.profile);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep("details");
  }

  function continueFromOwner() {
    const message = validateOwner(draft.owner);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep("preview");
  }

  async function createSalon() {
    if (!draft.method || draft.method === "admin") {
      setError("Choose a registration method first.");
      return;
    }

    const profileMessage = validateProfile(draft.profile);
    if (profileMessage) {
      setError(profileMessage);
      setStep("profile");
      return;
    }
    const ownerMessage = validateOwner(draft.owner);
    if (ownerMessage) {
      setError(ownerMessage);
      setStep("owner");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/register/salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: draft.method,
          profile: draft.profile,
          details: draft.details,
          owner: {
            ownerName: draft.owner.ownerName,
            ownerEmail: draft.owner.ownerEmail,
            password: draft.owner.password,
            acceptedTerms: draft.owner.acceptedTerms,
          },
        }),
      });

      const payload = (await response.json()) as
        | (CreateSalonRegistrationResult & { loginRequired?: boolean })
        | { error?: string; loginRequired?: boolean; dashboardPath?: string };

      if (!response.ok && response.status !== 201) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Could not create salon.",
        );
      }

      if ("loginRequired" in payload && payload.loginRequired) {
        window.location.assign(
          `/login?next=${encodeURIComponent("/platform/salon")}`,
        );
        return;
      }

      if ("error" in payload && payload.error && !("salonId" in payload)) {
        throw new Error(payload.error);
      }

      const ok = payload as CreateSalonRegistrationResult;
      setResult(ok);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create salon.");
    } finally {
      setSubmitting(false);
    }
  }

  const progress =
    step === "success" ? 6 : STEP_PROGRESS[step as Exclude<WizardStep, "success">];

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#F7F4EF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.95),_transparent_55%)]" />
      <div className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full bg-[#D9E4F5]/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 size-80 rounded-full bg-[#E8D9C8]/40 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <AllBookMark size={28} variant="ink" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
              AllBook
            </span>
          </Link>
          <p className="text-[13px] text-neutral-500">Salon registration</p>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-[12px] font-medium text-neutral-500">
            <span>Onboarding</span>
            <span>
              {progress} / 6
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200/80">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all duration-500 ease-out"
              style={{ width: `${(progress / 6) * 100}%` }}
            />
          </div>
        </div>

        <div
          className={cn(
            "rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-md sm:p-9",
            step === "success" && "bg-white",
          )}
        >
          {step === "method" ? (
            <RegistrationMethod onSelect={selectMethod} />
          ) : null}

          {step === "profile" && draft.method === "google" ? (
            <GoogleRegistration
              value={draft.profile}
              onChange={(profile) => setDraft((prev) => ({ ...prev, profile }))}
              onBack={() => {
                setError(null);
                setStep("method");
              }}
              onContinue={continueFromProfile}
              error={error}
            />
          ) : null}

          {step === "profile" && draft.method === "manual" ? (
            <ManualRegistration
              value={draft.profile}
              onChange={(profile) => setDraft((prev) => ({ ...prev, profile }))}
              onBack={() => {
                setError(null);
                setStep("method");
              }}
              onContinue={continueFromProfile}
              onClaimMatch={claimCatalogueMatch}
              error={error}
            />
          ) : null}

          {step === "details" ? (
            <BusinessDetails
              value={draft.details}
              onChange={(details) => setDraft((prev) => ({ ...prev, details }))}
              onBack={() => {
                setError(null);
                setStep("profile");
              }}
              onContinue={() => {
                setError(null);
                setStep("owner");
              }}
            />
          ) : null}

          {step === "owner" ? (
            <OwnerAccount
              value={draft.owner}
              onChange={(owner) => setDraft((prev) => ({ ...prev, owner }))}
              onBack={() => {
                setError(null);
                setStep("details");
              }}
              onContinue={continueFromOwner}
              error={error}
            />
          ) : null}

          {step === "preview" ? (
            <PreviewSalon
              profile={draft.profile}
              details={draft.details}
              submitting={submitting}
              error={error}
              onBack={() => {
                setError(null);
                setStep("owner");
              }}
              onCreate={createSalon}
            />
          ) : null}

          {step === "success" && result ? (
            <RegistrationSuccess result={result} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
