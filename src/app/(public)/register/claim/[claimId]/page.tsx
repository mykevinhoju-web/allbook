"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ClaimStatus = {
  claim: {
    id: string;
    status: string;
    verificationState: string;
    emailVerifiedAt: string | null;
    businessVerifiedAt: string | null;
    ownershipVerifiedAt: string | null;
    postalFallbackEligible: boolean;
    riskFlags: string[];
    matchConfidence: number;
  };
  business: {
    id: string;
    name: string;
    suburb: string | null;
    city: string;
    websiteHost: string | null;
    phoneHint: string | null;
    hasWebsite: boolean;
    hasPhone: boolean;
  };
  methods: {
    primary: string[];
    showPostal: boolean;
    smsAvailable: boolean;
  };
  conflict: boolean;
};

export default function ClaimVerificationPage() {
  const params = useParams<{ claimId: string }>();
  const claimId = params.claimId;

  const [status, setStatus] = useState<ClaimStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"choose" | "website" | "phone" | "postal">(
    "choose",
  );
  const [websiteToken, setWebsiteToken] = useState<string | null>(null);
  const [websiteMeta, setWebsiteMeta] = useState<string | null>(null);
  const [websiteFile, setWebsiteFile] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/register/claim/${claimId}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load claim.");
      return;
    }
    setStatus(data as ClaimStatus);
  }, [claimId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/register/claim/${claimId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function startWebsite() {
    const data = await post("start_website");
    setWebsiteToken(data.token);
    setWebsiteMeta(data.instructions?.metaTag ?? null);
    setWebsiteFile(data.instructions?.fileBody ?? null);
    setMode("website");
    setInfo("Add the token to your website, then confirm.");
  }

  async function confirmWebsite() {
    if (!websiteToken) return;
    const data = await post("confirm_website", { token: websiteToken });
    if (data.outcome === "verified") {
      window.location.assign("/platform/salon");
      return;
    }
    setInfo(`Status: ${data.outcome}. ${data.claim?.verification_state ?? ""}`);
    await load();
    setMode("choose");
  }

  async function startPhone() {
    const data = await post("start_phone", { phone });
    setMode("phone");
    setInfo(data.message);
    if (data.testOtp) setOtp(data.testOtp);
  }

  async function confirmPhone() {
    const data = await post("confirm_phone", { otp, phone });
    if (data.outcome === "verified") {
      window.location.assign("/platform/salon");
      return;
    }
    setInfo(`Status: ${data.outcome}`);
    await load();
  }

  async function startPostal() {
    const data = await post("start_postal");
    setMode("postal");
    setInfo(data.message);
    if (data.testCode) setPostalCode(data.testCode);
  }

  async function confirmPostal() {
    const data = await post("confirm_postal", { code: postalCode });
    if (data.outcome === "verified") {
      window.location.assign("/platform/salon");
      return;
    }
    setInfo(`Status: ${data.outcome}`);
    await load();
  }

  if (!status && !error) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F7F4EF] px-5">
        <p className="text-sm text-neutral-600">Loading claim…</p>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#F7F4EF] px-5">
        <div className="max-w-md rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm text-rose-700">{error}</p>
          <Link href="/login" className="mt-4 inline-block text-sm underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const claim = status!.claim;
  const business = status!.business;
  const verified = Boolean(claim.ownershipVerifiedAt) || claim.status === "verified";

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F7F4EF] px-5 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          Claim verification
        </p>
        <h1 className="font-serif text-3xl tracking-tight text-neutral-950">
          Is this your business?
        </h1>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <p className="font-medium text-neutral-900">{business.name}</p>
          <p className="text-sm text-neutral-600">
            {[business.suburb, business.city].filter(Boolean).join(", ")}
          </p>
        </div>

        {status!.conflict ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950">
            This business already has a verified owner. Additional verification
            is required. We will not replace the existing owner automatically.
          </p>
        ) : null}

        {verified ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-800">
              Ownership verified. You can open your salon dashboard.
            </p>
            <Link
              href="/platform/salon"
              className="inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-600">
              <li>Confirm this is your business</li>
              <li>
                Verify your AllBook account email
                {claim.emailVerifiedAt ? " ✓" : " (required)"}
              </li>
              <li>Prove you control the business contact point</li>
            </ol>

            {!claim.emailVerifiedAt ? (
              <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Confirm your AllBook account email, then refresh this page.
              </p>
            ) : null}

            {mode === "choose" && claim.emailVerifiedAt ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-neutral-800">
                  Choose verification method
                </p>
                {business.hasWebsite ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void startWebsite()}
                    className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
                  >
                    Verify website
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setMode("phone")}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-200 bg-white text-sm font-semibold text-neutral-900"
                >
                  Verify business phone
                </button>
                {status!.methods.showPostal ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void startPostal()}
                    className="flex h-11 w-full items-center justify-center rounded-full border border-dashed border-neutral-300 bg-white text-sm font-medium text-neutral-700"
                  >
                    Verify by mail (last resort)
                  </button>
                ) : (
                  <p className="text-[12px] text-neutral-500">
                    Other options (including mail) appear if website/phone
                    verification is unavailable or the claim is high-risk.
                  </p>
                )}
              </div>
            ) : null}

            {mode === "website" ? (
              <div className="space-y-3 text-sm">
                <p className="font-medium">Website verification</p>
                <p className="text-neutral-600">
                  Publish one of these on {business.websiteHost ?? "your site"}:
                </p>
                {websiteMeta ? (
                  <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-3 text-[11px] text-white">
                    {websiteMeta}
                  </pre>
                ) : null}
                <p className="text-neutral-600">
                  Or file <code>/.well-known/allbook-verification.txt</code> with:
                </p>
                <pre className="overflow-x-auto rounded-xl bg-neutral-100 p-3 text-[11px]">
                  {websiteFile}
                </pre>
                <button
                  type="button"
                  disabled={busy || !websiteToken}
                  onClick={() => void confirmWebsite()}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
                >
                  I published the token — check now
                </button>
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => setMode("choose")}
                >
                  Back
                </button>
              </div>
            ) : null}

            {mode === "phone" ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Business phone verification</p>
                <input
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm"
                  placeholder="Business phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !phone.trim()}
                  onClick={() => void startPhone()}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
                >
                  Send code
                </button>
                <input
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm"
                  placeholder="OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !otp.trim()}
                  onClick={() => void confirmPhone()}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-neutral-200 text-sm font-semibold"
                >
                  Confirm code
                </button>
                {!status!.methods.smsAvailable ? (
                  <p className="text-[12px] text-amber-800">
                    SMS delivery is not configured in this environment. Use
                    website verification when possible, or continue with a
                    queued/manual path.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => setMode("choose")}
                >
                  Back
                </button>
              </div>
            ) : null}

            {mode === "postal" ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Postal verification</p>
                <p className="text-sm text-neutral-600">
                  Last-resort only. Enter the one-time code from the letter when
                  you receive it.
                </p>
                <input
                  className="h-11 w-full rounded-2xl border border-neutral-200 px-3 text-sm"
                  placeholder="Postal code"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <button
                  type="button"
                  disabled={busy || !postalCode.trim()}
                  onClick={() => void confirmPostal()}
                  className="flex h-11 w-full items-center justify-center rounded-full bg-neutral-950 text-sm font-semibold text-white"
                >
                  Confirm postal code
                </button>
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => setMode("choose")}
                >
                  Back
                </button>
              </div>
            ) : null}
          </>
        )}

        {info ? (
          <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
            {info}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <p className="text-[12px] text-neutral-500">
          Google listing data helps identify the business. It does not prove
          ownership by itself.
        </p>
      </div>
    </div>
  );
}
